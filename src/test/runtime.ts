import { AccountType, AuthTokenSchema, AuthTokenType, Permission } from '@nodescript/api-proto';
import { JwtService } from '@nodescript/microframework';
import { config } from 'dotenv';
import { dep } from 'mesh-ioc';

import { App } from '../main/app.js';
import { HttpScope } from '../main/HttpScope.js';
import { AuthContext } from '../main/scoped/AuthContext.js';
import { NodeScriptApi } from '../main/scoped/NodeScriptApi.js';
import { NodeScriptApiMock } from './mocks/NodeScriptApiMock.js';

config({ path: '.env' });
config({ path: '.env.test' });
config({ path: '.env.dev' });

export class TestRuntime {

    @dep({ cache: false }) authContext!: AuthContext;
    @dep({ cache: false }) jwt!: JwtService;
    @dep({ cache: false }) nsApiMock!: NodeScriptApiMock;

    app = new App();
    httpScope = new HttpScope(this.app.mesh);

    async setup() {
        this.app = new App();
        this.httpScope = new HttpScope(this.app.mesh);
        // Allow resolving deps directly from the session scope
        this.httpScope.connect(this);
        this.httpScope.service(NodeScriptApiMock);
        this.httpScope.alias(NodeScriptApi, NodeScriptApiMock);
        await this.app.start();
    }

    async teardown() {
        await this.app.stop();
    }

    // async setupDatabases() {
    //     await this.mongodb.start();
    //     await this.mongodb.db.dropDatabase();
    // }

    // async stopDatabases() {
    //     await this.mongodb.stop();
    // }

    authenticateWorkspace(orgId: string, workspaceId: string, scopes: Permission[]) {
        const authToken = AuthTokenSchema.create({
            tokenType: AuthTokenType.ACCESS_TOKEN,
            principal: {
                id: 'test',
                type: AccountType.SYSTEM,
                displayName: 'Test',
            },
            orgId,
            workspaceId,
            scopes,
        });
        this.authContext.set(authToken);
    }

}

export const runtime = new TestRuntime();
