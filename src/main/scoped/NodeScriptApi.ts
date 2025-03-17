import { ApiProtocol, apiProtocol, Org, UsageLabels, Workspace } from '@nodescript/api-proto';
import { HttpContext } from '@nodescript/http-server';
import { createHttpClient } from '@nodescript/protocomm';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { AuthContext } from './AuthContext.js';

export class NodeScriptApi {

    @config({ default: 'https://api.nodescript.dev' })
    NODESCRIPT_API_URL!: string;

    @dep() private ctx!: HttpContext;
    @dep() private authContext!: AuthContext;

    async getWorkspace(workspaceId: string): Promise<Workspace> {
        const client = this.createClient();
        const { workspace } = await client.Workspace.getWorkspaceById({ id: workspaceId });
        return workspace;
    }

    async getOrg(orgId: string): Promise<Org> {
        const client = this.createClient();
        const { org } = await client.Org.getOrgById({ id: orgId });
        return org;
    }

    async addUsage(millicredits: number, skuId: string, skuName: string, status: number): Promise<void> {
        const token = this.authContext.requireAuth();
        if (!token.orgId || !token.workspaceId) {
            throw new Error('Invalid token');
        }
        const org = await this.getOrg(token.orgId);
        const workspace = await this.getWorkspace(token.workspaceId);
        const usage: UsageLabels = {
            orgId: org.id,
            orgName: org.displayName,
            workspaceId: workspace.id,
            workspaceName: workspace.displayName,
            skuId,
            skuName,
            status: String(status),
        };
        const client = this.createClient();
        await client.Billing.addUsage({ millicredits, usage });
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
