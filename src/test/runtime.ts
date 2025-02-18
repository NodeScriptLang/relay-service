import { config } from 'dotenv';
import { dep } from 'mesh-ioc';

import { App } from '../main/app.js';
import { HttpScope } from '../main/HttpScope.js';
import { TestHttpServer } from './test-server.js';
config({ path: '.env' });
config({ path: '.env.test' });
config({ path: '.env.dev' });

export class TestRuntime {

    @dep({ cache: false }) testHttpServer!: TestHttpServer;

    app = new App();
    httpScope = new HttpScope(this.app.mesh);

    async setup() {
        this.app = new App();
        this.app.mesh.connect(this);
        this.app.mesh.service(TestHttpServer);
        await this.app.start();
        await this.testHttpServer.start();
    }

    async teardown() {
        await this.testHttpServer.stop();
        await this.app.stop();
    }

    get baseUrl() {
        return `http://localhost:${process.env.HTTP_PORT ?? '8080'}`;
    }

}

export const runtime = new TestRuntime();
