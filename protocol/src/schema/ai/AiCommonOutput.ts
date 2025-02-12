import { Schema } from 'airtight';

import { AiVendor, AiVendorSchema } from './AiVendor.js';

export interface AiCommonOutput {
    content: string;
    totalTokens: number;
    model: string;
    aiVendor: AiVendor;
    cost?: number;
    metadata?: Record<string, any>;
}

export const AiCommonOutputSchema = new Schema<AiCommonOutput>({
    content: { type: 'string' },
    totalTokens: { type: 'number' },
    model: { type: 'string' },
    aiVendor: { ...AiVendorSchema.schema },
    cost: {
        type: 'number',
        nullable: true,
    },
    metadata: {
        type: 'object',
        nullable: true,
    },
});
