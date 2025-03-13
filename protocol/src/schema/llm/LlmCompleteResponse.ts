import { Schema } from 'airtight';

export interface LlmCompleteResponse {
    body: Record<string, any>;
}

export const LlmCompleteResponseSchema = new Schema<LlmCompleteResponse>({
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    },
});
