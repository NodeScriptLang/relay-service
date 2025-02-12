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
    model: { type: 'string' },
    prompt: { type: 'number' },
    aiVendor: { ...AiVendorSchema.schema },
    maxTokens: {
        type: 'number',
        nullable: true,
    },
    temperature: {
        type: 'number',
        nullable: true,
    },
    topP: {
        type: 'number',
        nullable: true,
    },
});
