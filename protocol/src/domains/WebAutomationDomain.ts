import { DomainDef } from '@nodescript/protocomm';

import { ScrapeWebpage, ScrapeWebpageSchema } from '../schema/web-automation/ScrapeWebpage.js';
import { ScrapeWebpageResponse, ScrapeWebpageResponseSchema } from '../schema/web-automation/ScrapeWebpageResponse.js';

export interface WebAutomationDomain {
    scrapeWebpage(req: {
        request: ScrapeWebpage;
    }): Promise<{
        response: ScrapeWebpageResponse;
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
    },
    events: {},
};
