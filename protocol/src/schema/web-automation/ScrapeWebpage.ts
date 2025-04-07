import { Schema } from 'airtight';

export interface ScrapeWebpage {
    url: string;
    proxyUrl: string;
    javascript: string;
    sleep: number;
    cookies: any;
    outputScreenshots: boolean;
}

export const ScrapeWebpageSchema = new Schema<ScrapeWebpage>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        proxyUrl: { type: 'string' },
        javascript: { type: 'string' },
        sleep: { type: 'number' },
        cookies: { type: 'any' },
        outputScreenshots: { type: 'boolean' },
    },
});
