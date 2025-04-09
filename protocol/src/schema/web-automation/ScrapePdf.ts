import { Schema } from 'airtight';

export interface ScrapePdf {
    url: string;
    responseType: 'markdown' | 'text';
}

export const ScrapePdfSchema = new Schema<ScrapePdf>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        responseType: {
            type: 'string',
            enum: ['markdown', 'text'],
            default: 'markdown'
        }
    },
});
