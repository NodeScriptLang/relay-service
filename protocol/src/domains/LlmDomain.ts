import { DomainDef } from '@nodescript/protocomm';

import { LlmCompleteResponse, LlmCompleteResponseSchema } from '../schema/llm/LlmCompleteResponse.js';
import { LlmGenerateImage, LlmGenerateImageSchema } from '../schema/llm/LlmGenerateImage.js';
import { LlmGenerateStructuredData, LlmGenerateStructuredDataSchema } from '../schema/llm/LlmGenerateStructuredData.js';
import { LlmGenerateText, LlmGenerateTextSchema } from '../schema/llm/LlmGenerateText.js';
import { LlmModelType, LlmModelTypeSchema } from '../schema/llm/LlmModelType.js';

export interface LlmDomain {

    getModels(req: {
        modelType: LlmModelType;
    }): Promise<{
        models: string[];
    }>;

    generateText(req: {
        request: LlmGenerateText;
    }): Promise<{
        response: LlmCompleteResponse;
    }>;

    generateStructuredData(req: {
        request: LlmGenerateStructuredData;
    }): Promise<{
        response: LlmCompleteResponse;
    }>;

    generateImage(req: {
        request: LlmGenerateImage;
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
        generateText: {
            type: 'command',
            params: {
                request: LlmGenerateTextSchema.schema,
            },
            returns: {
                response: LlmCompleteResponseSchema.schema,
            }
        },
        generateStructuredData: {
            type: 'command',
            params: {
                request: LlmGenerateStructuredDataSchema.schema,
            },
            returns: {
                response: LlmCompleteResponseSchema.schema,
            }
        },
        generateImage: {
            type: 'command',
            params: {
                request: LlmGenerateImageSchema.schema,
            },
            returns: {
                response: LlmCompleteResponseSchema.schema,
            }
        }
    },
    events: {},
};
