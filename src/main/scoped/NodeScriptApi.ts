import { ApiProtocol, apiProtocol, Workspace } from '@nodescript/api-proto';
import { HttpContext } from '@nodescript/http-server';
import { createHttpClient } from '@nodescript/protocomm';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class NodeScriptApi {

    @config({ default: 'https://api.nodescript.dev' })
    NODESCRIPT_API_URL!: string;

    @dep() private ctx!: HttpContext;

    async getWorkspace(workspaceId: string): Promise<Workspace> {
        const client = this.createClient();
        const { workspace } = await client.Workspace.getWorkspaceById({ id: workspaceId });
        return workspace;
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
