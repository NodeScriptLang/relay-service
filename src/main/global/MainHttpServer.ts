import { HttpContext, HttpNext, HttpServer } from '@nodescript/http-server';
import { dep, Mesh } from 'mesh-ioc';

import { HttpScope } from '../HttpScope.js';
import { MainHttpHandler } from '../scoped/MainHttpHandler.js';

export class MainHttpServer extends HttpServer {

    @dep() private mesh!: Mesh;

    async handle(ctx: HttpContext, next: HttpNext) {
        const scope = new HttpScope(this.mesh);
        scope.constant(HttpContext, ctx);
        const handler = scope.resolve(MainHttpHandler);
        await handler.handle(ctx, next);
    }

}
