import { DomainDef } from '@nodescript/protocomm';

import { ScrapeWebpage, ScrapeWebpageSchema } from '../schema/web-automation/ScrapeWebpage.js';

export interface WebAutomationDomain {
    scrapeWebpage(req: {
        input: ScrapeWebpage;
    }): Promise<{
        output: ScrapeWebpage;
    }>;
}

export const WebAutomationDomain: DomainDef<WebAutomationDomain> = {
    name: 'WebAutomation',
    methods: {
        scrapeWebpage: {
            type: 'command',
            params: {
                input: ScrapeWebpageSchema.schema,
            },
            returns: {
                output: ScrapeWebpageSchema.schema,
            },
        },
    },
    events: {},
};
