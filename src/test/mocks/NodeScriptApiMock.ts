import { Org, OrgSchema, Workspace, WorkspaceSchema } from '@nodescript/api-proto';
import { NotFoundError } from '@nodescript/errors';

import { NodeScriptApi } from '../../main/scoped/NodeScriptApi.js';

export class NodeScriptApiMock extends NodeScriptApi {

    mockOrg: Org | null = null;
    mockWorkspace: Workspace | null = null;

    setMockOrg(org: Partial<Org>) {
        this.mockOrg = OrgSchema.create(org);
    }

    setMockWorkspace(workspace: Partial<Workspace>) {
        this.mockWorkspace = WorkspaceSchema.create(workspace);
    }

    override async getOrg(orgId: string): Promise<Org> {
        if (!this.mockOrg || this.mockOrg.id !== orgId) {
            throw new NotFoundError('Org not found');
        }
        return this.mockOrg;
    }

    override async getWorkspace(workspaceId: string): Promise<Workspace> {
        if (!this.mockWorkspace || this.mockWorkspace.id !== workspaceId) {
            throw new NotFoundError('Workspace not found');
        }
        return this.mockWorkspace;
    }

}
