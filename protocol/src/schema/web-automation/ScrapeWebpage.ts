import { Schema } from 'airtight';

export interface ScrapeWebpage {
    url: string;
    proxyUrl?: string;
    javascript?: string;
    sleep?: number;
    cookies?: any;
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
            type: 'any',
            optional: true,
        },
        outputScreenshots: {
            type: 'boolean',
            optional: true,
        },
    },
});
