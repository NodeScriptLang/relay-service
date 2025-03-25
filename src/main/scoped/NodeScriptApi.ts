import { ApiProtocol, apiProtocol, UsageLabels } from '@nodescript/api-proto';
import { HttpContext } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { createHttpClient } from '@nodescript/protocomm';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { AuthContext } from './AuthContext.js';

export class NodeScriptApi {

    @config({}) NODESCRIPT_TOKEN!: string;
    @config({ default: 'https://api.nodescript.dev' }) NODESCRIPT_API_URL!: string;

    @dep() private ctx!: HttpContext;
    @dep() private authContext!: AuthContext;
    @dep() private logger!: Logger;

    async getWorkspaceId(): Promise<string> {
        const token = this.authContext.requireAuth();
        if (!token.workspaceId) {
            throw new Error('Invalid token');
        }
        return token.workspaceId;
    }

    async addUsage(millicredits: number, skuId: string, skuName: string, status: number): Promise<void> {
        const client = this.createClient();

        const token = this.authContext.requireAuth();
        if (!token.orgId || !token.workspaceId) {
            throw new Error('Invalid token');
        }

        const { org } = await client.Org.getOrgById({ id: token.orgId });
        const { workspace } = await client.Workspace.getWorkspaceById({ id: token.workspaceId });

        const backendClient = this.createBackendClient();
        const usage: UsageLabels = {
            orgId: org.id,
            orgName: org.displayName,
            workspaceId: workspace.id,
            workspaceName: workspace.displayName,
            skuId,
            skuName,
            status: String(status),
        };
        await backendClient.Billing.addUsage({ millicredits, usage });
        this.logger.info('Usage added', { orgId: org.id, workspaceId: workspace.id, skuId, skuName, millicredits });
    }

    protected createBackendClient(): ApiProtocol {
        return createHttpClient(apiProtocol, {
            baseUrl: this.NODESCRIPT_API_URL,
            headers: {
                'Authorization': `Bearer ${this.NODESCRIPT_TOKEN}`,
            },
        });
    }

    protected createClient(): ApiProtocol {
        return createHttpClient(apiProtocol, {
            baseUrl: this.NODESCRIPT_API_URL,
            headers: {
                'Authorization': this.ctx.getRequestHeader('Authorization', ''),
            },
        });
    }

}
