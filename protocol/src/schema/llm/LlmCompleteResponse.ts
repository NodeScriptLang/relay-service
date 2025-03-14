import { Schema } from 'airtight';

export interface LlmCompleteResponse {
    content: string;
    totalTokens?: number;
    fullResponse: Record<string, any>;
}

export const LlmCompleteResponseSchema = new Schema<LlmCompleteResponse>({
    type: 'object',
    properties: {
        content: { type: 'string' },
        totalTokens: {
            type: 'number',
            optional: true,
        },
        fullResponse: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    },
});
