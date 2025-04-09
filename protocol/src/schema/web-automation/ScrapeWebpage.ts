import { Schema } from 'airtight';

import { Cookie, CookieSchema } from './Cookie.js';

export interface ScrapeWebpage {
    url: string;
    proxyUrl?: string;
    javascript?: string;
    sleep?: number;
    cookies?: Cookie[];
    outputScreenshots?: boolean;
}

export const ScrapeWebpageSchema = new Schema<ScrapeWebpage>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        proxyUrl: {
            type: 'string',
            optional: true,
        },
        javascript: {
            type: 'string',
            optional: true,
        },
        sleep: {
            type: 'number',
            optional: true,
        },
        cookies: {
            type: 'array',
            items: CookieSchema.schema,
            optional: true,
        },
        outputScreenshots: {
            type: 'boolean',
            optional: true,
        },
    },
});
