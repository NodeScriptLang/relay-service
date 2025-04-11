import { RateLimitExceededError } from '@nodescript/errors';
import { Logger } from '@nodescript/logger';
import { ScrapePdf, ScrapeResponse, ScrapeWebpage, WebAutomationDomain } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { RedisManager } from '../global/RedisManager.js';
import { WebAutomationService } from '../services/web-automation/WebAutomationService.js';
import { calculateMillicredits } from '../utils/cost.js';
import { getDate, getHour, HOUR_SECONDS } from '../utils/date.js';
import { NodeScriptApi } from './NodeScriptApi.js';

export class WebAutomationDomainImpl implements WebAutomationDomain {

    @config({ default: 0.00029 }) WEB_AUTOMATION_PRICE_PER_CREDIT!: number;
    @config({ default: 600 }) WEB_AUTOMATION_CACHE_RATE_LIMIT_WINDOW_SECONDS!: number;
    @config({ default: HOUR_SECONDS }) WEB_AUTOMATION_RATE_LIMIT_TTL_SECONDS!: number;

    @dep() private logger!: Logger;
    @dep() private nsApi!: NodeScriptApi;
    @dep() private redis!: RedisManager;
    @dep() private webAutomationService!: WebAutomationService;

    async scrapeWebpage(req: { request: ScrapeWebpage }): Promise<{ response: ScrapeResponse }> {
        const { url } = req.request;

        try {
            const workspaceId = await this.nsApi.getWorkspaceId();
            await this.handleRateLimit(workspaceId);

            const response = await this.webAutomationService.scrapeWebpage(req.request);
            this.logger.info('WebAutomationDomainImpl scrapeWebpage', { url });
            const cost = 0.00001; // TODO review cost
            const millicredits = calculateMillicredits(cost, this.WEB_AUTOMATION_PRICE_PER_CREDIT);
            const skuId = 'webAutomation:scrapeWebpage';
            const skuName = 'Web Automation Scrape Webpage';
            await this.nsApi.addUsage(millicredits, skuId, skuName, 200);
            return { response };
        } catch (error) {
            this.logger.error('WebAutomationDomainImpl scrapeWebpage', { url, error });
            throw error;
        }
    }

    async scrapePdf(req: { request: ScrapePdf }): Promise<{ response: string }> {
        const { url } = req.request;

        try {
            const workspaceId = await this.nsApi.getWorkspaceId();
            await this.handleRateLimit(workspaceId);

            const response = await this.webAutomationService.scrapePdf(req.request);
            this.logger.info('WebAutomationDomainImpl scrapePdf', { url });
            const cost = 0.00001; // TODO review cost
            const millicredits = calculateMillicredits(cost, this.WEB_AUTOMATION_PRICE_PER_CREDIT);
            const skuId = 'webAutomation:scrapePdf';
            const skuName = 'Web Automation Scrape Pdf';
            await this.nsApi.addUsage(millicredits, skuId, skuName, 200);
            return { response };
        } catch (error) {
            this.logger.error('WebAutomationDomainImpl scrapePdf', { url, error });
            throw error;
        }
    }

    private async handleRateLimit(workspaceId: string) {
        const date = getDate();
        const hour = getHour();
        const key = `Relay:llm:rateLimit:${workspaceId}:${date}:${hour}`;
        const currentCount = await this.redis.client.incr(key);
        if (currentCount === 1) {
            await this.redis.client.expire(key, this.WEB_AUTOMATION_RATE_LIMIT_TTL_SECONDS);
        }
        if (currentCount > this.WEB_AUTOMATION_CACHE_RATE_LIMIT_WINDOW_SECONDS) {
            throw new RateLimitExceededError();
        }
    }

}
