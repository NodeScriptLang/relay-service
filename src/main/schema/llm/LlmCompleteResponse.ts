import { FetchResponseBody } from '@nodescript/core/types';
import { Schema } from 'airtight';

import { FetchHeaders, FetchHeadersSchema } from '../FetchHeaders.js';

export interface LlmCompleteResponse {
    body: FetchResponseBody;
    status: number;
    headers: FetchHeaders;
    url: string;
    method: string;
}

export const LlmCompleteResponseSchema = new Schema<LlmCompleteResponse>({
    type: 'object',
    properties: {
        body: { type: 'any' },
        status: { type: 'number' },
        headers: FetchHeadersSchema.schema,
        url: { type: 'string' },
        method: { type: 'string' },
    },
});
