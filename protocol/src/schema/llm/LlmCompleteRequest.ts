import { Schema } from 'airtight';

export interface LlmCompleteRequest {
    providerId: string;
    modelType: string;
    method: string;
    params: any;
}

export const LlmCompleteRequestSchema = new Schema<LlmCompleteRequest>({
    type: 'object',
    properties: {
        providerId: { type: 'string' },
        modelType: { type: 'string' },
        method: { type: 'string' },
        params: { type: 'any' },
    },
});
