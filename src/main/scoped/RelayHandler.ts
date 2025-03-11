import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod, FetchRequestSpec, FetchResponseBody } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { HttpContext, HttpRoute, HttpRouter } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { Schema } from 'airtight';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { ServiceProvider, ServiceProviderSchema } from '../schema/ServiceProvider.js';

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
            const providersConfig = await this.readProviderConfig();
            const provider = providersConfig[ctx.params.providerId];
            const req = await this.parseRequestSpec(ctx, provider);

            let res;
            // TODO r1 see if we can remove this branching; fetchUndici should be able to handle both cases
            if (provider.headersAllowArray) {
                const fetchHeaders: Record<string, string> = {};
                for (const [key, value] of Object.entries(req.headers)) {
                    fetchHeaders[key] = Array.isArray(value) ? value[0] : value;
                }
                const fetchResponse = await fetch(req.url, {
                    method: req.method,
                    headers: fetchHeaders,
                    body: bodyString,
                    redirect: req.followRedirects ? 'follow' : 'manual',
                });

                ctx.status = fetchResponse.status;
                ctx.responseHeaders = {};
                fetchResponse.headers.forEach((value, key) => {
                    ctx.responseHeaders[key] = [value];
                });
                delete ctx.responseHeaders['content-encoding'];

                const responseBuffer = await fetchResponse.arrayBuffer();
                ctx.responseBody = Buffer.from(responseBuffer);
                res = {
                    status: fetchResponse.status,
                    headers: ctx.responseHeaders,
                    body: {
                        arrayBuffer: async () => responseBuffer,
                    } as FetchResponseBody
                };
            } else {
                res = await fetchUndici(req, bodyString);
                ctx.status = res.status;
                ctx.responseHeaders = Object.fromEntries(
                    Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
                );
                ctx.responseBody = res.body;
            }

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

    private async parseRequestSpec(ctx: HttpContext, provider: ServiceProvider): Promise<FetchRequestSpec> {
        const providerId = ctx.params.providerId;
        const path = ctx.params['*'];
        if (!provider) {
            throw new Error(`Unsupported service provider: ${providerId}`);
        }
        const targetUrl = await this.parseUrl(provider, path);
        this.logger.info('Calling external service provider URL', { url: targetUrl.toString() });

        const headers = { ...ctx.requestHeaders };
        delete headers['host'];
        delete headers['authorization'];
        delete headers['connection'];
        delete headers['content-length'];

        this.logger.info('Provider info', { authParamKey: provider.authKey, useBearer: provider.useBearer });
        if (provider.key && provider.authSchema === 'header') {
            // TODO r1 see if we can get rid of useBearer (just include that into the value of the secret key)
            // TODO r1 authKey and key are a bit confusing, could use some renaming
            headers[provider.authKey] = [`${provider.useBearer ? 'Bearer ' : ''}${provider.key}`];
        }
        if (provider.key && provider.authSchema === 'query') {
            targetUrl.searchParams.append(provider.authKey, provider.key);
        }
        if (provider.metadata['headers']) {
            const metadataHeaders = provider.metadata['headers'];
            for (const key in metadataHeaders) {
                if (Object.prototype.hasOwnProperty.call(metadataHeaders, key)) {
                    const value = metadataHeaders[key];
                    headers[key] = [value];
                }
            }
        }
        if (provider.metadata['queries']) {
            const metadataQueries = provider.metadata['queries'];
            for (const key in metadataQueries) {
                if (Object.prototype.hasOwnProperty.call(metadataQueries, key)) {
                    const value = metadataQueries[key];
                    targetUrl.searchParams.append(key, value);
                }
            }
        }

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

const ServiceProvidersSchema = new Schema<Record<string, ServiceProvider>>({
    type: 'object',
    properties: {},
    additionalProperties: ServiceProviderSchema.schema,
});
