import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod, FetchRequestSpec } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { HttpContext, HttpRoute, HttpRouter } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { CounterMetric, HistogramMetric, metric } from '@nodescript/metrics';
import { readFile } from 'fs/promises';
import { dep } from 'mesh-ioc';

export class RelayHandler extends HttpRouter {

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
        ['*', `/*`, ctx => this.handleRequest(ctx)],
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

    async readConfig() {
        const env = process.env.NODE_ENV || 'development';
        let configJson: Record<string, any> = {};
        if (env === 'production') {
            try {
                configJson = JSON.parse(await readFile(`./secrets/production/config.json`, 'utf-8'));
            } catch (error) {
                console.error('Failed to decrypt key file');
                console.error(error);
                process.exit(1);
            }
        } else if (env === 'development') {
            configJson = JSON.parse(await readFile(`./secrets/development/config.json`, 'utf-8'));
        } else {
            throw new Error(`NODE_ENV not set`);
        }
        return configJson;
    }

    async parseUrl(ctx: HttpContext) {
        const configJson = await this.readConfig();
        const pathParts = ctx.path.split('/');
        const vendor = pathParts[1];
        if (!configJson[vendor]) {
            throw new Error(`Unsupported vendor: ${vendor}`);
        }
        const vendorConfig = configJson[vendor];
        const baseUrl = vendorConfig.baseUrl.replace(/\/$/, '');
        const remainingPath = pathParts.slice(2).join('/');

        const fullUrl = `${baseUrl}/${remainingPath}`;

        return new URL(fullUrl);
    }

    private async parseRequestSpec(ctx: HttpContext): Promise<FetchRequestSpec> {
        const targetUrl = await this.parseUrl(ctx);

        const headers = { ...ctx.requestHeaders };
        delete headers['host'];
        delete headers['connection'];
        delete headers['content-length'];

        const config = await this.readConfig();
        const vendor = ctx.path.split('/')[1];
        if (config[vendor]?.key) {
            headers['authorization'] = [`Bearer ${config[vendor].key}`];
        }

        return FetchRequestSpecSchema.create({
            method: ctx.method as FetchMethod,
            url: targetUrl.toString(),
            headers,
            followRedirects: true,
            timeout: 30000,
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
