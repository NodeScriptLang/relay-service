import { DomainDef } from '@nodescript/protocomm';

import { ScrapePdf, ScrapePdfSchema } from '../schema/web-automation/ScrapePdf.js';
import { ScrapePlaywright, ScrapePlaywrightSchema } from '../schema/web-automation/ScrapePlaywright.js';
import { ScrapeResponse, ScrapeResponseSchema } from '../schema/web-automation/ScrapeResponse.js';
import { ScrapeWebpage, ScrapeWebpageSchema } from '../schema/web-automation/ScrapeWebpage.js';

export interface WebAutomationDomain {

    scrapeWebpage(req: {
        request: ScrapeWebpage;
    }): Promise<{
        response: ScrapeResponse;
    }>;

    scrapePdf(req: {
        request: ScrapePdf;
    }): Promise<{
        response: string;
    }>;

    scrapePlaywright(req: {
        request: ScrapePlaywright;
    }): Promise<{
        response: ScrapeResponse;
    }>;

}

export const WebAutomationDomain: DomainDef<WebAutomationDomain> = {
    name: 'WebAutomation',
    methods: {
        scrapeWebpage: {
            type: 'command',
            params: {
                request: ScrapeWebpageSchema.schema,
            },
            returns: {
                response: ScrapeResponseSchema.schema,
            },
        },
        scrapePdf: {
            type: 'command',
            params: {
                request: ScrapePdfSchema.schema,
            },
            returns: {
                response: { type: 'string' },
            },
        },
        scrapePlaywright: {
            type: 'command',
            params: {
                request: ScrapePlaywrightSchema.schema,
            },
            returns: {
                response: ScrapeResponseSchema.schema,
            },
        },
    },
    events: {},
};
