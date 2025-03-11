import { HttpChain, HttpContext, HttpCorsHandler, HttpErrorHandler, HttpHandler, HttpNext } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { HttpAuthHandler } from './HttpAuthHandler.js';
import { RelayHandler } from './RelayHandler.js';

export class MainHttpHandler implements HttpHandler {

    @dep() private errorHandler!: HttpErrorHandler;
    @dep() private authHandler!: HttpAuthHandler;
    @dep() private corsHandler!: HttpCorsHandler;
    @dep() private relayHandler!: RelayHandler;

    private corsConfigHandler: HttpHandler = {
        async handle(ctx, next) {
            ctx.state.corsExposeHeaders = 'Content-Length,Date,Status,Headers';
            ctx.state.corsAllowCredentials = false;
            await next();
        },
    };

    private handler = new HttpChain([
        this.errorHandler,
        this.authHandler,
        this.corsConfigHandler,
        this.corsHandler,
        this.relayHandler,
    ]);

    async handle(ctx: HttpContext, next: HttpNext) {
        await this.handler.handle(ctx, next);
    }

}
