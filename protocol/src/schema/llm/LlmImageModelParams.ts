import { Schema } from 'airtight';

export interface LlmImageModelParams {
    n?: number;
    size?: string;
    responseFormat?: string;
    user?: string;
    quality?: string;
    style?: string;
}

export const LlmImageModelParamsSchema = new Schema<LlmImageModelParams>({
    type: 'object',
    properties: {
        n: {
            type: 'number',
            optional: true,
        },
        size: {
            type: 'string',
            optional: true,
        },
        responseFormat: {
            type: 'string',
            optional: true,
        },
        user: {
            type: 'string',
            optional: true,
        },
        quality: {
            type: 'string',
            optional: true,
        },
        style: {
            type: 'string',
            optional: true,
        },
    },
});
