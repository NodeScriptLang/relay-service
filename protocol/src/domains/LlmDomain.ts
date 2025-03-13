import { DomainDef } from '@nodescript/protocomm';

import { LlmCompleteRequest, LlmCompleteRequestSchema } from '../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse, LlmCompleteResponseSchema } from '../schema/llm/LlmCompleteResponse.js';

export interface LlmDomain {

    complete(req: {
        request: LlmCompleteRequest;
    }): Promise<{
        response: LlmCompleteResponse;
    }>;

}

export const LlmDomain: DomainDef<LlmDomain> = {
    name: 'Llm',
    methods: {
        complete: {
            type: 'command',
            params: {
                request: LlmCompleteRequestSchema.schema,
            },
            returns: {
                response: LlmCompleteResponseSchema.schema,
            }
        },
    },
    events: {},
};
