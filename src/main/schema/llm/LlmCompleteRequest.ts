import { Schema } from 'airtight';

import { FetchHeaders, FetchHeadersSchema } from '../FetchHeaders.js';

export interface LlmCompleteRequest {
    modelType: string;
    method: string;
    headers: FetchHeaders;
    params: any;
}

export const LlmCompleteRequestSchema = new Schema<LlmCompleteRequest>({
    type: 'object',
    properties: {
        modelType: { type: 'string' },
        method: { type: 'string' },
        headers: FetchHeadersSchema.schema,
        params: { type: 'any' },
    },
});
