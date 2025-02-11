import { Workspace, WorkspaceSchema } from '@nodescript/api-proto';
import { NotFoundError } from '@nodescript/errors';

import { NodeScriptApi } from '../../main/scoped/NodeScriptApi.js';

export class NodeScriptApiMock extends NodeScriptApi {

    mockWorkspace: Workspace | null = null;

    setMockWorkspace(workspace: Partial<Workspace>) {
        this.mockWorkspace = WorkspaceSchema.create(workspace);
    }

    override async getWorkspace(workspaceId: string): Promise<Workspace> {
        if (!this.mockWorkspace || this.mockWorkspace.id !== workspaceId) {
            throw new NotFoundError('Workspace not found');
        }
        return this.mockWorkspace;
    }

}
