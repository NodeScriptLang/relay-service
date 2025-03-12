import { HttpContext, HttpRoute, HttpRouter } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { dep } from 'mesh-ioc';

import { AnthropicLlmService } from '../services/llm/AnthropicLlmService.js';
import { DeepseekLlmService } from '../services/llm/DeepseekLlmService.js';
import { GeminiLlmService } from '../services/llm/GeminiLlmService.js';
import { LlmService } from '../services/llm/LlmService.js';
import { OpenaAiLlmService } from '../services/llm/OpenaAiLlmService.js';

export class RelayHandler extends HttpRouter {

    @dep() private logger!: Logger;
    @dep() private openaAiLlmService!: OpenaAiLlmService;
    @dep() private anthropicLlmService!: AnthropicLlmService;
    @dep() private geminiLlmService!: GeminiLlmService;
    @dep() private deepseekLlmService!: DeepseekLlmService;

    private llmServices: Record<string, LlmService> = {};

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
        ['*', `/{serviceType}/{providerId}/*`, ctx => this.handleRequest(ctx)],
    ];

    constructor() {
        super();
        this.llmServices = {
            'openai': this.openaAiLlmService,
            'anthropic': this.anthropicLlmService,
            'gemini': this.geminiLlmService,
            'deepseek': this.deepseekLlmService,
        };
    }

    async handleRequest(ctx: HttpContext) {
        try {
            const serviceType = ctx.params.serviceType;
            const providerId = ctx.params.providerId;
            const path = ctx.params['*'];
            const body = await ctx.readRequestBody();

            const headers = { ...ctx.requestHeaders };
            delete headers['host'];
            delete headers['authorization'];
            delete headers['connection'];
            delete headers['content-length'];

            let res: any = {};
            if (serviceType === 'llm') {
                const service = this.llmServices[providerId];
                if (!service) {
                    ctx.status = 400;
                    ctx.responseBody = { error: `Unsupported LLM provider: ${providerId}` };
                    return;
                }

                const modelType = path.split('/')[0];
                res = await service.complete({
                    modelType,
                    method: ctx.method,
                    headers,
                    params: body,
                });
                ctx.status = res.status || 200;
                ctx.responseHeaders = Object.fromEntries(
                    Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
                );
                ctx.responseBody = res.body;
            }

            const size = Number(res.headers['content-length']) || 0;
            this.logger.info('Request served', {
                url: res.url,
                status: res.status,
                size,
            });
            this.requestLatency.addMillis(Date.now() - ctx.startedAt, {
                status: res.status,
                method: res.method,
                hostname: this.tryParseHostname(res.url),
            });
            this.responseSize.incr(size, {
                status: res.status,
                method: res.method,
                hostname: this.tryParseHostname(res.url),
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

    private tryParseHostname(url: string) {
        try {
            const { hostname } = new URL(url);
            return hostname;
        } catch (_err) {
            return '<invalid url>';
        }
    }

}
