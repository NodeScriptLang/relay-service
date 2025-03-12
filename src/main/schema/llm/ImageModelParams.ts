import { Schema } from 'airtight';

export interface ImageModelParams {
    model: string;
    userPrompt: string;
    systemPrompt: string;
    n?: number;
    size?: string;
    responseFormat?: string;
    user?: string;
    quality?: string;
    style?: string;
}

export const ImageModelParamsSchema = new Schema<ImageModelParams>({
    type: 'object',
    properties: {
        model: { type: 'string' },
        userPrompt: { type: 'string' },
        systemPrompt: { type: 'string' },
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
