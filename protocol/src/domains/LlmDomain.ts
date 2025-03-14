import { DomainDef } from '@nodescript/protocomm';

import { LlmCompleteRequest, LlmCompleteRequestSchema } from '../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse, LlmCompleteResponseSchema } from '../schema/llm/LlmCompleteResponse.js';
import { LlmModelType, LlmModelTypeSchema } from '../schema/llm/LlmModelType.js';

export interface LlmDomain {

    getModels(req: {
        modelType: LlmModelType;
    }): Promise<{
        models: string[];
    }>;

    complete(req: {
        request: LlmCompleteRequest;
    }): Promise<{
        response: LlmCompleteResponse;
    }>;

}

export const LlmDomain: DomainDef<LlmDomain> = {
    name: 'Llm',
    methods: {
        getModels: {
            type: 'query',
            params: {
                modelType: LlmModelTypeSchema.schema,
            },
            returns: {
                models: {
                    type: 'array',
                    items: { type: 'string' },
                },
            },
        },
        complete: {
            type: 'command',
            params: {
                request: LlmCompleteRequestSchema.schema,
            },
            returns: {
                response: LlmCompleteResponseSchema.schema,
            }
        }
    },
    events: {},
};
