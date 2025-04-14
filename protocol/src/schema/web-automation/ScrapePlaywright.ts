import { Schema } from 'airtight';

export interface ScrapePlaywright {
    url: string;
    script: string;
}

export const ScrapePlaywrightSchema = new Schema<ScrapePlaywright>({
    type: 'object',
    properties: {
        url: { type: 'string' },
        script: {
            type: 'string',
        }
    },
});
