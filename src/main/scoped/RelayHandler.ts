import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod, FetchRequestSpec } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { HttpContext, HttpRoute, HttpRouter } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { Schema } from 'airtight';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { ServiceProvider, ServiceProviderSchema } from '../schema/ServiceProvider.js';
import { AnthropicService } from '../services/AnthropicService.js';
import { DeepseekService } from '../services/DeepseekService.js';
import { GeminiService } from '../services/GeminiService.js';
import { OpenaAiService } from '../services/OpenaAiService.js';

export class RelayHandler extends HttpRouter {

    @config() SERVICE_PROVIDERS!: string;

    @dep() private logger!: Logger;
    @dep() private anthropicService!: AnthropicService;
    @dep() private deepseekService!: DeepseekService;
    @dep() private geminiService!: GeminiService;
    @dep() private openaAiService!: OpenaAiService;

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
        ['*', `/{modelType}/{providerId}/*`, ctx => this.handleRequest(ctx)],
    ];

    async handleRequest(ctx: HttpContext) {
        try {
            const body = await this.formatRequestBody(ctx);
            const bodyString = body ? JSON.stringify(body) : {};
            const providersConfig = await this.readProviderConfig();
            const provider = providersConfig[ctx.params.providerId];
            const req = await this.parseRequestSpec(ctx, provider);

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

        this.logger.info('Provider info', { authParamName: provider.authParamName });
        if (provider.authToken && provider.authSchema === 'header') {
            headers[provider.authParamName] = [`${provider.authToken}`];
        }
        if (provider.authToken && provider.authSchema === 'query') {
            targetUrl.searchParams.append(provider.authParamName, provider.authToken);
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

    private async formatRequestBody(ctx: HttpContext): Promise<Record<string, any>> {
        const providerId = ctx.params.providerId;
        const modelType = ctx.params.modelType;
        const body = await ctx.readRequestBody();

        if (providerId === 'anthropic' && modelType === 'text') {
            return this.anthropicService.formatTextRequestBody(body);
        }

        if (providerId === 'deepseek' && modelType === 'text') {
            return this.deepseekService.formatTextRequestBody(body);
        }

        if (providerId === 'gemini' && modelType === 'text') {
            return this.geminiService.formatTextRequestBody(body);
        }

        if (providerId === 'openai' && modelType === 'text') {
            return this.openaAiService.formatTextRequestBody(body);
        }

        if (providerId === 'openai' && modelType === 'image') {
            return this.openaAiService.formatImageRequestBody(body);
        }

        return body;
    }

}

const ServiceProvidersSchema = new Schema<Record<string, ServiceProvider>>({
    type: 'object',
    properties: {},
    additionalProperties: ServiceProviderSchema.schema,
});
