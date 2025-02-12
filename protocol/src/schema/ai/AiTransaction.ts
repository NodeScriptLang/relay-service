import { IdSchema } from '@nodescript/core/util';
import { Schema } from 'airtight';

import { AiVendor, AiVendorSchema } from './AiVendor.js';

export interface AiTransaction {
    id: string;
    orgId: string;
    workspaceId: string;
    aiVendor: AiVendor;
    model: string;
    totalTokens: number;
    cost?: number;
    metadata?: Record<string, any>;
    createdAt: number;

}

export const AiTransactionSchema = new Schema<AiTransaction>({
    type: 'object',
    properties: {
        id: IdSchema.schema,
        orgId: IdSchema.schema,
        workspaceId: IdSchema.schema,
        aiVendor: AiVendorSchema.schema,
        model: { type: 'string' },
        totalTokens: { type: 'number' },
        cost: {
            type: 'number',
            optional: true
        },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
            optional: true,
        },
        createdAt: { type: 'number' },
    }

});
