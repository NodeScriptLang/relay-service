import { Schema } from 'airtight';

export interface LlmCompleteResponse {
    content: string;
    totalTokens?: number;
    status: number;
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
        status: { type: 'number' },
        fullResponse: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    },
});
