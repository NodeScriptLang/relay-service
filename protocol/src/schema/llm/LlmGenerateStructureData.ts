import { Schema } from 'airtight';

import { LlmTextModelParams, LlmTextModelParamsSchema } from './LlmTextModelParams.js';

export interface LlmGenerateStructureData {
    model: string;
    prompt: string;
    system: string;
    data: any;
    params?: LlmTextModelParams;
}

export const LlmGenerateStructureDataSchema = new Schema<LlmGenerateStructureData>({
    type: 'object',
    properties: {
        model: { type: 'string' },
        prompt: { type: 'string' },
        system: { type: 'string' },
        data: { type: 'any' },
        params: {
            ...LlmTextModelParamsSchema.schema,
            optional: true
        },
    },
});
