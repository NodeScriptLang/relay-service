import { Schema } from 'airtight';

import { LlmImageModelParams, LlmImageModelParamsSchema } from './LlmImageModelParams.js';

export interface LlmGenerateImage {
    model: string;
    prompt: string;
    system: string;
    params?: LlmImageModelParams;
}

export const LlmGenerateImageSchema = new Schema<LlmGenerateImage>({
    type: 'object',
    properties: {
        model: { type: 'string' },
        prompt: { type: 'string' },
        system: { type: 'string' },
        params: {
            ...LlmImageModelParamsSchema.schema,
            optional: true
        },
    },
});
