import { Schema } from 'airtight';

export interface ImageReqParameters {
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

export const ImageReqParametersSchema = new Schema<ImageReqParameters>({
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
