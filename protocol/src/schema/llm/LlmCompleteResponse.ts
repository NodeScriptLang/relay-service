import { Schema } from 'airtight';

export interface LlmCompleteResponse {
    body: Record<string, any>;
    status: number;
    headers: any;
    endpointUrl: string;
}

export const LlmCompleteResponseSchema = new Schema<LlmCompleteResponse>({
    type: 'object',
    properties: {
        body: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
        status: { type: 'number' },
        headers: { type: 'any' },
        endpointUrl: { type: 'string' },
    },
});
