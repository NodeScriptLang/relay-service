import { ScrapePdf, ScrapeResponse, ScrapeWebpage } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

export interface AutomationCloudRequest {
    method: string;
    path: string;
    body?: Record<string, any>;
}

export class WebAutomationService {

    @config() WEB_AUTOMATION_AC_SECRET_KEY!: string;
    @config() WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_WEBPAGE!: string;
    @config() WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_PDF!: string;
    @config() WEB_AUTOMATION_AC_ORGANISATION_ID!: string;
    @config({ default: 'https://api.automationcloud.net' }) WEB_AUTOMATION_AC_API_URL!: string;

    @config({ default: 60 }) MAX_POLL_ATTEMPTS!: number;
    @config({ default: 2000 }) POLL_INTERVAL_MS!: number;

    private async executeJob(jobInput: Record<string, any>, serviceId: string): Promise<any> {
        const job = await this.sendRequest({
            method: 'POST',
            path: 'jobs',
            body: {
                input: jobInput,
                serviceId,
                category: 'live',
            }
        });

        let currentJob = job;
        let attempts = 0;

        try {
            while (currentJob.state !== 'success' && attempts < this.MAX_POLL_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, this.POLL_INTERVAL_MS));

                currentJob = await this.getJob(job.id);
                attempts++;

                if (currentJob.state === 'fail') {
                    throw this.handleError({
                        message: `Job failed: ${currentJob.error || 'Unknown error'}`,
                        code: 'JOB_FAILED',
                        details: currentJob
                    });
                }
            }

            if (currentJob.state !== 'success') {
                throw this.handleError({
                    message: 'Job timed out',
                    code: 'JOB_TIMEOUT',
                    details: currentJob
                });
            }

            return await this.getJobOutputs(job.id);
        } catch (error) {
            this.cancelJob(job.id).catch(() => {});
            throw error;
        }
    }

    async scrapeWebpage(request: ScrapeWebpage): Promise<ScrapeResponse> {
        const jobOutputs = await this.executeJob({
            url: request.url,
            proxyUrl: request.proxyUrl,
            javascript: request.javascript,
            sleep: request.sleep,
            cookies: request.cookies,
        }, this.WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_WEBPAGE);
        return this.parseJobOutputs(jobOutputs);
    }

    async scrapePdf(request: ScrapePdf): Promise<string> {
        const jobOutputs = await this.executeJob({
            url: request.url,
        }, this.WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_PDF);
        const parsed = this.parseJobOutputs(jobOutputs);
        if (request.responseFormat === 'text') {
            return parsed.text;
        }
        return parsed.markdown;
    }

    // Helpers

    private async sendRequest(request: AutomationCloudRequest) {
        const res = await fetch(`${this.WEB_AUTOMATION_AC_API_URL}/${request.path}`, {
            method: request.method,
            headers: {
                'Authorization': `Bearer ${this.WEB_AUTOMATION_AC_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'x-ubio-organisation-id': this.WEB_AUTOMATION_AC_ORGANISATION_ID,
                'x-ubio-client-id': '',
            },
            ...(request.body ?
                { body: JSON.stringify({
                    ...request.body
                }) } :
                {})
        });
        return await res.json(); ;
    }

    private async getJob(jobId: string) {
        const res = await this.sendRequest({
            method: 'GET',
            path: `jobs/${jobId}`
        });
        return res;
    }

    private async getJobOutputs(jobId: string): Promise<Array<Record<string, any>>> {
        const res = await this.sendRequest({
            method: 'GET',
            path: `jobs/${jobId}/outputs`
        });
        return res;
    }

    async cancelJob(jobId: string) {
        return this.sendRequest({
            method: 'POST',
            path: `jobs/${jobId}/cancel`
        });
    }

    private parseJobOutputs(jobOutput: any): ScrapeResponse {
        const outputs = Array.isArray(jobOutput?.data) ? jobOutput.data : (Array.isArray(jobOutput) ? jobOutput : []);

        const pairs = outputs
            .filter((output: any) => output.key && output.data !== undefined)
            .map((output: any) => [output.key, output.data]);
        const result = Object.fromEntries(pairs);

        return {
            input: result.inputUrl || '',
            url: result.url || '',
            title: result.title || '',
            text: result.text || '',
            markdown: result.markdown || '',
            parsedJson: result.parsedJson || [],
            html: result.html || '',
            images: Array.isArray(result.images) ? result.images : [],
            allImages: Array.isArray(result.allImages) ? result.allImages : [],
            links: Array.isArray(result.links) ? result.links : [],
            cookies: Array.isArray(result.cookies) ? result.cookies : []
        };
    }

    handleError(error: any): Error {
        const err: any = new Error(error.message || 'Unknown Web Automation service error');
        err.originalError = error;
        err.code = error.code || 'UNKNOWN_ERROR';
        err.type = error.name || 'WebAutomationServiceError';
        err.status = error.status || 500;
        err.details = error.details || {};
        if (error.response) {
            err.responseStatus = error.response.status;
            err.responseBody = error.response.body;
        }
        return err;
    }

}
