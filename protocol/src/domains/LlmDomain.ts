import { DomainDef } from '@nodescript/protocomm';

import { LlmCompleteResponse, LlmCompleteResponseSchema } from '../schema/llm/LlmCompleteResponse.js';
import { LlmGenerateImage, LlmGenerateImageSchema } from '../schema/llm/LlmGenerateImage.js';
import { LlmGenerateStructureData, LlmGenerateStructureDataSchema } from '../schema/llm/LlmGenerateStructureData.js';
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

    generateStructureData(req: {
        request: LlmGenerateStructureData;
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
        generateStructureData: {
            type: 'command',
            params: {
                request: LlmGenerateStructureDataSchema.schema,
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
