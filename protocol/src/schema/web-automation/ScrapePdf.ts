import { Schema } from 'airtight';

export interface ScrapePdf {
    url: string;
    responseFormat: 'markdown' | 'text';
}

export const ScrapePdfSchema = new Schema<ScrapePdf>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        responseFormat: {
            type: 'string',
            enum: ['markdown', 'text'],
            default: 'markdown'
        }
    },
});
