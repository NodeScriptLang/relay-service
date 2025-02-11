import { AuthTokenSchema } from '@nodescript/api-proto';
import { InvalidAuthenticationError } from '@nodescript/errors';
import { HttpContext, HttpHandler, HttpNext } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { JwtService } from '@nodescript/microframework';
import { dep } from 'mesh-ioc';

import { AuthContext } from './AuthContext.js';

export class HttpAuthHandler implements HttpHandler {

    @dep() private ctx!: HttpContext;
    @dep() private jwt!: JwtService;
    @dep() private logger!: Logger;
    @dep() private authContext!: AuthContext;

    async handle(ctx: HttpContext, next: HttpNext) {
        try {
            const authToken = await this.getAuthToken();
            this.authContext.set(authToken);
            ctx.state.actor = authToken?.principal.displayName ?? 'Anonymous';
            return next();
        } catch (error) {
            this.authContext.set(null);
            throw error;
        }
    }

    private async getAuthToken() {
        const authorization = this.ctx.getRequestHeader('authorization');
        if (authorization) {
            return await this.processAuthorization(authorization);
        }
        return null;
    }

    private async processAuthorization(authorization: string) {
        const m = /^(token|bearer)\s+(.*)/i.exec(authorization);
        if (m) {
            return await this.processBearerJwt(m[2]);
        }
        throw new InvalidAuthenticationError();
    }

    private async processBearerJwt(token: string) {
        try {
            return this.jwt.decodeToken(token, AuthTokenSchema);
        } catch (error) {
            this.logger.warn('Bearer token auth failed', { error });
            throw new InvalidAuthenticationError();
        }
    }

}
