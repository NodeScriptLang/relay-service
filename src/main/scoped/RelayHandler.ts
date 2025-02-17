import { EndpointAsset, Integration, Org, Workspace } from '@nodescript/api-proto';
import { RequestMethod, RequestSpec } from '@nodescript/core/schema';
import { NotFoundError } from '@nodescript/errors';
import { HttpContext, HttpDict, HttpHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { HistogramMetric, metric } from '@nodescript/metrics';
import { objectTrim } from '@nodescript/object-trim';
import { matchPath } from '@nodescript/pathmatcher';
import { dep } from 'mesh-ioc';

const EXTENDED_LATENCY_BUCKETS = [
    0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5,
    1, 2.5, 5, 10, 20, 30, 60,
    90, 120, 180, 240, 300, 600, 900, 1200
];

export class RelayHandler implements HttpHandler {

    @dep() private endpointStorage!: EndpointAssetStorage;
    @dep() private invocationSampler!: InvocationSampler;
    @dep() private invokeServiceClient!: InvokeServiceClient;
    @dep() private integrationStorage!: IntegrationStorage;
    @dep() private oauthAppStorage!: OAuthAppStorage;
    @dep() private invokeTierManager!: InvokeTierManager;
    @dep() private invokeVariables!: InvokeVariables;
    @dep() private logger!: Logger;
    @dep() private orgStorage!: OrgStorage;
    @dep() private invokeLimit!: InvokeLimitService;
    @dep() private usageSampler!: UsageRecordSampler;
    @dep() private usageService!: UsageService;
    @dep() private workspaceStorage!: WorkspaceStorage;

    @metric()
    private latency = new HistogramMetric<{ status: number; tier: string }>(
        'nodescript_gateway_latency_seconds',
        'Invoke request latency',
        EXTENDED_LATENCY_BUCKETS);

    async handle(ctx: HttpContext): Promise<void> {
        const startedAt = Date.now();
        let workspace: Workspace | undefined;
        let org: Org | undefined;
        let endpoint: EndpointAsset | undefined;
        let tier: string | undefined;
        let target: string | undefined;
        try {
            workspace = await this.discoverWorkspace(ctx);
            org = await this.orgStorage.fetchOrgById(workspace.org.id);
            this.invokeLimit.checkSuspended(org);
            await this.applyRateLimit(workspace, ctx);
            endpoint = await this.discoverEndpoint(workspace, ctx);
            tier = await this.invokeTierManager.discoverTier(workspace.invokeTier ?? org.invokeTier ?? 'default', endpoint.bundleUrl);
            target = await this.invokeTierManager.getInvokeTarget(endpoint.bundleUrl, tier);
            const request = await this.createRequestSpec(ctx);
            const variables = await this.invokeVariables.fetchVariables(endpoint.workspace.id, endpoint.org.id);
            const timeout = workspace.invokeTimeout ?? undefined;
            const response = await this.invokeServiceClient.sendToTarget(target, endpoint.bundleUrl, {
                $request: request,
                $variables: variables,
            }, timeout);
            const integrations = await this.integrationStorage.getWorkspaceIntegrations(workspace.id);
            for (const integration of integrations) {
                const oauthApp = await this.oauthAppStorage.fetchOAuthAppById(integration.oauthAppId);
                if (oauthApp.native) {
                    await this.handleNativeAppAuth(ctx, integration);
                }
            }
            ctx.status = response.status;
            ctx.addResponseHeaders(response.headers);
            ctx.responseBody = response.body;
            await this.invokeTierManager.incrSuccessfulRuns(endpoint.bundleUrl);
            await this.reportSample(
                org,
                workspace,
                endpoint,
                Date.now() - startedAt,
                ctx.status,
                { request, response },
            );
        } catch (error: any) {
            if (error.code === 'ECONNRESET') {
                // Client connection closed, do nothing
                return;
            }
            const errorObject = {
                name: error?.name ?? 'UnknownError',
                message: error?.message ?? '',
            };
            ctx.status = error?.status ?? 500;
            ctx.responseBody = errorObject;
            this.logger.error('Invocation failed', {
                error,
                orgId: org?.id,
                workspaceId: workspace?.id,
                endpointId: endpoint?.id,
                endpointMethod: endpoint?.method,
                endpointPath: endpoint?.pathname,
                moduleId: endpoint?.moduleId,
                tier,
                target,
            });
            if (org && workspace && endpoint) {
                await this.reportSample(
                    org,
                    workspace,
                    endpoint,
                    Date.now() - startedAt,
                    ctx.status,
                    { error: errorObject },
                );
            }
        } finally {
            const latency = Date.now() - startedAt;
            ctx.setResponseHeader('X-Response-Latency', `${latency}`);
            this.latency.addMillis(latency, {
                status: ctx.status,
                tier,
            });
        }
    }

    /**
     * Workspace Id can be supplied via a request header.
     * Alternatively, domain name is used to find the workspace.
     */
    private async discoverWorkspace(ctx: HttpContext): Promise<Workspace> {
        let workspaceId: string | null = ctx.getRequestHeader('ns-workspace-id');
        if (!workspaceId) {
            workspaceId = await this.workspaceStorage.findWorkspaceIdByDomain(ctx.host);
        }
        if (!workspaceId) {
            throw new NotFoundError('Workspace not found');
        }
        const workspace = await this.workspaceStorage.fetchWorkspaceById(workspaceId);
        return workspace;
    }

    private async discoverEndpoint(workspace: Workspace, ctx: HttpContext): Promise<EndpointAsset> {
        const endpoints = await this.endpointStorage.getWorkspaceEndpoints(workspace.id);
        for (const ep of endpoints) {
            if (this.matchEndpoint(ep, ctx)) {
                return ep;
            }
        }
        throw new NotFoundError('Endpoint not found');
    }

    private matchEndpoint(ep: EndpointAsset, ctx: HttpContext) {
        if (ep.method === '*' || ep.method.toLowerCase() === ctx.method.toLowerCase()) {
            if (matchPath(ep.pathname, ctx.path)) {
                return ep;
            }
        }
    }

    private async applyRateLimit(workspace: Workspace, ctx: HttpContext) {
        const { limit, remaining } = await this.invokeLimit.checkRateLimit(workspace);
        ctx.setResponseHeader('X-RateLimit-Limit', `${limit}`);
        ctx.setResponseHeader('X-RateLimit-Remaining', `${remaining}`);
    }

    private async createRequestSpec(ctx: HttpContext): Promise<RequestSpec> {
        const body = await ctx.readRequestBody();
        return {
            method: ctx.method as RequestMethod,
            path: ctx.path,
            query: ctx.query,
            headers: this.cleanupRequestHeaders(ctx.requestHeaders),
            body,
        };
    }

    private async reportSample(
        org: Org,
        workspace: Workspace,
        endpoint: EndpointAsset,
        latencyMs: number,
        status: number,
        data: any,
    ) {
        this.invocationSampler.add(latencyMs, {
            orgId: org.id,
            workspaceId: workspace.id,
            kind: 'endpoint',
            sourceId: endpoint.id,
            source: `${endpoint.method} ${endpoint.pathname}`,
            moduleId: endpoint.moduleId,
            status: String(status),
            errorCode: data.error?.name ?? '',
        }, objectTrim(data, { addPlaceholders: true }));
        const millicredits = this.ceilToDecimal(latencyMs, -2);
        this.usageSampler.add(millicredits, {
            orgId: org.id,
            orgName: org.displayName,
            workspaceId: workspace.id,
            workspaceName: workspace.displayName,
            skuId: `endpoint:${endpoint.id}`,
            skuName: `${endpoint.method} ${endpoint.pathname}`,
        }, null);
        await this.usageService.trackCurrentUsage(org, millicredits);
    }

    private cleanupRequestHeaders(headers: HttpDict) {
        const newHeaders: HttpDict = {};
        for (const [key, values] of Object.entries(headers)) {
            // Drop X-Forwarded-*
            if (/^x-forwarded-/gi.test(key)) {
                continue;
            }
            // Drop X-Real-Ip
            if (/^x-real-ip$/gi.test(key)) {
                continue;
            }
            newHeaders[key] = values;
        }
        return newHeaders;
    }

    async handleNativeAppAuth(_ctx: HttpContext, _integration: Integration) {
        // const authToken = ctx.request.headers['authorization'];
        // con
        // if (!authToken || !this.isIntegrationAuthorized(integration)) {
        //     throw new AccessDeniedError('Workspace-scoped token required');
        // }
        // TODO check oauth app specific auth

        // TODO handle usage
    }

    private isIntegrationAuthorized(integration: Integration) {
        const expired = integration.expiresAt && integration.expiresAt < Date.now();
        return !integration.expiresAt || (integration.hasRefreshToken && !expired);
    }

    private ceilToDecimal(value: number, decimalPlaces = 1) {
        const multiplier = Math.pow(10, decimalPlaces);
        return Math.ceil(value * multiplier) / multiplier;
    }

}
