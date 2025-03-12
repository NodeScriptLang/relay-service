import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchHeaders, FetchMethod } from '@nodescript/core/types';
import { FetchResponseBody } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';

import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse } from '../../schema/llm/LlmCompleteResponse.js';

export abstract class LlmService {

    protected abstract getRequestUrl(modelType: string, model?: string): string;
    protected abstract getRequestHeaders(headers: FetchHeaders): FetchHeaders;
    protected abstract getRequestBody(modelType: string, params: any): Record<string, any>;

    async complete(llmReq: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        try {
            const url = this.getRequestUrl(llmReq.modelType, llmReq.params.model);
            const headers = this.getRequestHeaders(llmReq.headers);
            const body = this.getRequestBody(llmReq.modelType, llmReq.params);
            const bodyString = body ? JSON.stringify(body) : {};

            const req = FetchRequestSpecSchema.create({
                method: llmReq.method as FetchMethod,
                url,
                headers
            });

            const res = await fetchUndici(req, bodyString);

            const responseHeaders = Object.fromEntries(
                Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
            );

            return {
                body: await res.body,
                status: res.status,
                headers: responseHeaders,
                url: req.url,
                method: req.method,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    protected handleError(error: any): LlmCompleteResponse {
        return {
            body: {
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                type: error.name || 'Error'
            } as unknown as FetchResponseBody,
            status: error.status || 500,
            headers: {},
            url: '',
            method: '',
        };
    }

}
