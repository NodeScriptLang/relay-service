import { Schema } from 'airtight';

import { LlmTextModelParams, LlmTextModelParamsSchema } from './LlmTextModelParams.js';

export interface LlmGenerateText {
    model: string;
    prompt: string;
    system: string;
    params?: LlmTextModelParams;
}

export const LlmGenerateTextSchema = new Schema<LlmGenerateText>({
    type: 'object',
    properties: {
        model: { type: 'string' },
        prompt: { type: 'string' },
        system: { type: 'string' },
        params: {
            ...LlmTextModelParamsSchema.schema,
            optional: true
        },
    },
});
