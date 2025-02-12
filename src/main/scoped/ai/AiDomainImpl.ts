import { AccessDeniedError, RateLimitExceededError } from '@nodescript/errors';
import { AiCommonInput, AiCommonOutput, AiDomain, AiTransaction } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';
import { customAlphabet } from 'nanoid';

import { AiStorage } from '../../global/ai/AiStorage.js';
import { RedisManager } from '../../global/RedisManager.js';
import { AuthContext } from './../AuthContext.js';

export class AiDomainImpl implements AiDomain {

    @config({ default: 100 }) private CACHE_RATE_LIMIT!: number;
    @config({ default: 5 }) private CACHE_RATE_LIMIT_WINDOW_SECONDS!: number;
    @config({ default: 200 }) private CACHE_RATE_LIMIT_SLOWDOWN_MS!: number;

    @dep() private authContext!: AuthContext;
    @dep() private aiStorage!: AiStorage;
    @dep() private redis!: RedisManager;

    @config() OPEN_AI_API_KEY!: string;

    async execute(req: {
        endpointUrl: string;
        endpointMethod: string;
        commonInputs: AiCommonInput;
        inputs?: Record<string, any>;
    }): Promise<{ commonOutputs: AiCommonOutput; outputs?: Record<string, any> }> {
        const token = this.authContext.requireAuth();
        if (!token.workspaceId) {
            throw new AccessDeniedError('Workspace-scoped token required');
        }
        if (!token.orgId) {
            throw new AccessDeniedError('Org-scoped token required');
        }
        await this.checkRateLimit(token.workspaceId);

        // TODO add AI permissions
        // this.authContext.requirePermissions([Permission.WORKSPACE_AI_EXECUTE]);

        const res = await this.callUrlEndpoint(req.endpointMethod, req.endpointUrl, req.inputs || {});

        const aiTransaction: AiTransaction = {
            id: this.standardId()(),
            orgId: token.orgId,
            workspaceId: token.workspaceId,
            aiVendor: res.aiVendor,
            model: res.model,
            totalTokens: res.tokensUsed || 0,
            cost: res.cost || 0,
            metadata: res.metadata || {},
            createdAt: Date.now(),
        };
        await this.aiStorage.addUsage(aiTransaction);

        return {
            commonOutputs: res.commonOutputs,
            outputs: res.outputs
        };
    }

    private async callUrlEndpoint(method: string, url: string, inputs: Record<string, any>): Promise<any> {
        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.OPEN_AI_API_KEY}`,
            },
            body: JSON.stringify(inputs),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to call URL endpoint: ${text}`);
        }
        return res.json();
    }

    private async checkRateLimit(workspaceId: string) {
        const { remaining } = await this.getRateLimit(workspaceId);
        if (remaining <= 0) {
            // Experimental: add slowdown instead of throwing errors
            await new Promise(r => setTimeout(r, this.CACHE_RATE_LIMIT_SLOWDOWN_MS));
            throw new RateLimitExceededError();
        }
    }

    private async getRateLimit(workspaceId: string): Promise<{ limit: number; remaining: number }> {
        const window = Math.round(Date.now() / this.CACHE_RATE_LIMIT_WINDOW_SECONDS / 1000);
        const limit = this.CACHE_RATE_LIMIT * this.CACHE_RATE_LIMIT_WINDOW_SECONDS;
        const key = `Cache:rateLimit:${workspaceId}:${window}`;
        const requestCount = await this.redis.client.incr(key);
        await this.redis.client.expire(key, this.CACHE_RATE_LIMIT_WINDOW_SECONDS * 2);
        const remaining = Math.max(limit - requestCount, 0);
        return { limit, remaining };
    }

    // TODO extract to helpers
    private standardId() {
        return customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 16);
    }

}
