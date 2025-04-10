import { Schema } from 'airtight';

export interface WebLink {
    text: string;
    url: string;
}

export const WebLinkSchema = new Schema<WebLink>({
    type: 'object',
    properties: {
        text: { type: 'string' },
        url: { type: 'string' }
    },
});
