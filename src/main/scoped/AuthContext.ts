import { AccountInfo, AuthToken, Permission } from '@nodescript/api-proto';
import { AccessDeniedError, AuthenticationRequiredError } from '@nodescript/errors';

// TODO (bo) this is duplicated in nodescript-platform
export class AuthContext {

    authToken: AuthToken | null = null;

    isAuthenticated() {
        return !!this.authToken;
    }

    getToken() {
        return this.authToken;
    }

    requireAuth() {
        const { authToken } = this;
        if (!authToken) {
            throw new AuthenticationRequiredError();
        }
        return authToken;
    }

    // TODO (bo) this is a rough duplicate of requirePermissions from nodescript-platform
    requirePermissions(requiredPermissions: Permission[]) {
        const token = this.requireAuth();
        const scopes = token.scopes ?? [];
        const hasPermissions = requiredPermissions.every(p => scopes.includes(p));
        if (!hasPermissions) {
            throw new AccessDeniedError(`Missing required permissions: ${requiredPermissions.join(', ')}`);
        }
    }

    set(authToken: AuthToken | null) {
        this.authToken = authToken;
    }

    getPrincipal() {
        return this.authToken?.principal;
    }

    requirePrincipal(): AccountInfo {
        return this.requireAuth().principal;
    }

}
