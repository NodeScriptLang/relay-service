import { Schema } from 'airtight';

export type FetchHeaders = Record<string, string[]>;

export const FetchHeadersSchema = new Schema<FetchHeaders>({
    id: 'FetchHeaders',
    type: 'object',
    properties: {},
    additionalProperties: {
        type: 'array',
        items: { type: 'string' },
    },
});
