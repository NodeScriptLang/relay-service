import { DomainDef } from '@nodescript/protocomm';

import { ScrapePdf, ScrapePdfSchema } from '../schema/web-automation/ScrapePdf.js';
import { ScrapeWebpage, ScrapeWebpageSchema } from '../schema/web-automation/ScrapeWebpage.js';
import { ScrapeWebpageResponse, ScrapeWebpageResponseSchema } from '../schema/web-automation/ScrapeWebpageResponse.js';

export interface WebAutomationDomain {

    scrapeWebpage(req: {
        request: ScrapeWebpage;
    }): Promise<{
        response: ScrapeWebpageResponse;
    }>;

    scrapePdf(req: {
        request: ScrapePdf;
    }): Promise<{
        response: string;
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
                response: ScrapeWebpageResponseSchema.schema,
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
    },
    events: {},
};
