import { Schema } from 'airtight';

import { AiVendor, AiVendorSchema } from './AiVendor.js';

export interface AiCommonInput {
    model: string;
    prompt: number;
    aiVendor: AiVendor;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}

export const AiCommonInputSchema = new Schema<AiCommonInput>({
    type: 'object',
    properties: {
        model: { type: 'string' },
        prompt: { type: 'number' },
        aiVendor: AiVendorSchema.schema,
        maxTokens: {
            type: 'number',
            optional: true,
        },
        temperature: {
            type: 'number',
            optional: true,
        },
        topP: {
            type: 'number',
            optional: true,
        },
    }
});
