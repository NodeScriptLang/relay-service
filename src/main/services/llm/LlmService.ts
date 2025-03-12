import { FetchResponseBody } from '@nodescript/core/types';

import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse } from '../../schema/llm/LlmCompleteResponse.js';

export abstract class LlmService {

    abstract complete(llmReq: LlmCompleteRequest): Promise<LlmCompleteResponse>;

    handleError(error: any): LlmCompleteResponse {
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
