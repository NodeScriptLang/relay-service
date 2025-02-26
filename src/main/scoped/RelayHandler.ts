import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod, FetchRequestSpec } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { HttpContext, HttpRoute, HttpRouter } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { Schema } from 'airtight';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class RelayHandler extends HttpRouter {

    @config() SERVICE_PROVIDERS!: string;

    @dep() private logger!: Logger;

    @metric()
    private requestLatency = new HistogramMetric<{
        status: number;
        method: string;
        hostname: string;
        error?: string;
    }>('nodescript_relay_service_request_latency', 'NodeScript Relay Service request latency');

    @metric()
    private responseSize = new CounterMetric<{
        status: number;
        method: string;
        hostname: string;
    }>('nodescript_relay_service_response_size', 'NodeScript Relay Service response size');

    @metric()
    private errors = new CounterMetric<{
        error: string;
        code: string;
    }>('nodescript_relay_service_errors_total', 'NodeScript Relay Service errors');

    routes: HttpRoute[] = [
        ['*', `/{providerId}/*`, ctx => this.handleRequest(ctx)],
    ];

    async handleRequest(ctx: HttpContext) {
        try {
            const body = await ctx.readRequestBody();
            const bodyString = body ? JSON.stringify(body) : undefined;

            const req = await this.parseRequestSpec(ctx);
            const res = await fetchUndici(req, bodyString);

            ctx.status = res.status;
            ctx.responseHeaders = Object.fromEntries(
                Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
            );
            ctx.responseBody = res.body;
            const size = Number(res.headers['content-length']) || 0;
            this.logger.info('Request served', {
                url: req.url,
                status: res.status,
                size,
            });
            this.requestLatency.addMillis(Date.now() - ctx.startedAt, {
                status: res.status,
                method: req.method,
                hostname: this.tryParseHostname(req.url),
            });
            this.responseSize.incr(size, {
                status: res.status,
                method: req.method,
                hostname: this.tryParseHostname(req.url),
            });
        } catch (error: any) {
            error.stack = '';
            this.errors.incr(1, {
                error: error.name,
                code: error.code,
            });
            throw error;
        }
    }

    async readProviderConfig() {
        return ServiceProvidersSchema.decode(JSON.parse(this.SERVICE_PROVIDERS)) || '{}';
    }

    async parseUrl(providerInfo: ServiceProvider, path: string) {
        const baseUrl = providerInfo.baseUrl.replace(/\/$/, '');
        const fullUrl = `${baseUrl}/${path}`;
        return new URL(fullUrl);
    }

    private async parseRequestSpec(ctx: HttpContext): Promise<FetchRequestSpec> {
        const providersJson = await this.readProviderConfig();
        const providerId = ctx.params.providerId;
        const path = ctx.params['*'];
        const providerInfo = providersJson[providerId];
        if (!providerInfo) {
            throw new Error(`Unsupported service provider: ${providerId}`);
        }
        const targetUrl = await this.parseUrl(providerInfo, path);
        this.logger.info('Calling external service provider URL', { url: targetUrl.toString() });

        const headers = { ...ctx.requestHeaders };
        delete headers['host'];
        delete headers['connection'];
        delete headers['content-length'];

        this.logger.info('Provider info', { authParamKey: providerInfo.authKey, useBearer: providerInfo.useBearer });
        if (providerInfo.key && providerInfo.authSchema === 'header') {
            headers[providerInfo.authKey] = [`${providerInfo.useBearer ? 'Bearer ' : ''}${providerInfo.key}`];
        }
        if (providerInfo.key && providerInfo.authSchema === 'query') {
            targetUrl.searchParams.append(providerInfo.authKey, providerInfo.key);
        }
        if (providerInfo.metadata['headers']) {
            const metadataHeaders = providerInfo.metadata['headers'];
            for (const key in metadataHeaders) {
                if (Object.prototype.hasOwnProperty.call(metadataHeaders, key)) {
                    const value = metadataHeaders[key];
                    headers[key] = [value];
                }
            }
        }
        if (providerInfo.metadata['queries']) {
            const metadataQueries = providerInfo.metadata['queries'];
            for (const key in metadataQueries) {
                if (Object.prototype.hasOwnProperty.call(metadataQueries, key)) {
                    const value = metadataQueries[key];
                    targetUrl.searchParams.append(key, value);
                }
            }
        }
        // console.log('Headers', headers);
        // console.log('Target URL', targetUrl.toString());
        // console.log('Queries', targetUrl.searchParams.toString());

        this.logger.info('Requesting external service provider', { providerId });
        return FetchRequestSpecSchema.create({
            method: ctx.method as FetchMethod,
            url: targetUrl.toString(),
            headers,
            followRedirects: true,
            connectOptions: {},
        });
    }

    private tryParseHostname(url: string) {
        try {
            const { hostname } = new URL(url);
            return hostname;
        } catch (_err) {
            return '<invalid url>';
        }
    }

}

interface ServiceProvider {
    id: string;
    title: string;
    baseUrl: string;
    version: string;
    authSchema: 'header' | 'query';
    useBearer: boolean;
    authKey: string;
    key: string;
    metadata: Record<string, any>;
}

export const ServiceProviderSchema = new Schema<ServiceProvider>({
    type: 'object',
    properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        baseUrl: { type: 'string' },
        version: { type: 'string' },
        authSchema: {
            type: 'string',
            enum: ['header', 'query'],
        },
        useBearer: { type: 'boolean' },
        authKey: { type: 'string' },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
        key: { type: 'string' },
    },
});

const ServiceProvidersSchema = new Schema<Record<string, ServiceProvider>>({
    type: 'object',
    properties: {},
    additionalProperties: ServiceProviderSchema.schema,
});
