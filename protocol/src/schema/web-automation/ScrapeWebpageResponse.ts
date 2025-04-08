import { Schema } from 'airtight';

import { Cookie, CookieSchema } from './Cookie.js';
import { WebLink, WebLinkSchema } from './WebLink.js';

export interface ScrapeWebpageResponse {
    input: string;
    url: string;
    title: string;
    text: string;
    markdown: string;
    parsedJson: Array<Record<string, any>>;
    html: string;
    images: string[];
    allImages: string[];
    links: WebLink[];
    cookies: Cookie[];
}

export const ScrapeWebpageResponseSchema = new Schema<ScrapeWebpageResponse>({
    type: 'object',
    properties: {
        input: { type: 'string' },
        url: { type: 'string' },
        title: { type: 'string' },
        text: { type: 'string' },
        markdown: { type: 'string' },
        parsedJson: { type: 'any' },
        html: { type: 'string' },
        images: {
            type: 'array',
            items: { type: 'string' }
        },
        allImages: {
            type: 'array',
            items: { type: 'string' }
        },
        links: {
            type: 'array',
            items: WebLinkSchema.schema
        },
        cookies: {
            type: 'array',
            items: CookieSchema.schema
        },
    },
});
