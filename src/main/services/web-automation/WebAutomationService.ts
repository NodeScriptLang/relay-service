import { ScrapePdf, ScrapeResponse, ScrapeWebpage } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

export interface AutomationCloudRequest {
    method: string;
    path: string;
    body?: Record<string, any>;
}

type ResponseType = 'json' | 'binary' | 'base64';

export class WebAutomationService {

    @config({ default: 'https://api.automationcloud.net' }) WEB_AUTOMATION_AC_API_URL!: string;
    @config() WEB_AUTOMATION_AC_SECRET_KEY!: string;
    @config() WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_WEBPAGE!: string;
    @config() WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_PDF!: string;
    @config({ default: 120000 }) WEB_AUTOMATION_TIMEOUT_MS!: number;
    @config({ default: 2000 }) WEB_AUTOMATION_POLL_INTERVAL_MS!: number;

    // Modules

    async scrapeWebpage(request: ScrapeWebpage): Promise<ScrapeResponse> {
        return await this.executeJob({
            url: request.url,
            proxyUrl: request.proxyUrl,
            javascript: request.javascript,
            sleep: request.sleep,
            cookies: request.cookies,
        }, this.WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_WEBPAGE);
    }

    async scrapePdf(request: ScrapePdf): Promise<string> {
        const jobOutputs = await this.executeJob({
            url: request.url,
        }, this.WEB_AUTOMATION_AC_SERVICE_ID_SCRAPE_PDF);
        if (request.responseFormat === 'text') {
            return jobOutputs.text;
        }
        return jobOutputs.markdown;
    }

    // Helpers

    private async sendRequest(request: AutomationCloudRequest, responseType: ResponseType = 'json') {
        const res = await fetch(`${this.WEB_AUTOMATION_AC_API_URL}/${request.path}`, {
            method: request.method,
            headers: {
                'Authorization': `Basic ${btoa(`${this.WEB_AUTOMATION_AC_SECRET_KEY}:`)}`,
                'Content-Type': 'application/json'
            },
            ...(request.body ?
                { body: JSON.stringify({
                    ...request.body
                }) } :
                {})
        });

        if (responseType === 'binary') {
            return await res.blob();
        }

        if (responseType === 'base64') {
            const arrayBuffer = await res.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        return await res.json();
    }

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
        const startTime = Date.now();

        try {
            while (currentJob.state !== 'success' && Date.now() - startTime < this.WEB_AUTOMATION_TIMEOUT_MS) {
                await new Promise(resolve => setTimeout(resolve, this.WEB_AUTOMATION_POLL_INTERVAL_MS));

                currentJob = await this.getJob(job.id);

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
            const jobOutputs = await this.getJobOutputs(job.id);
            const parsed = this.parseJobOutputs(jobOutputs);
            const screenshots = await this.getJobScreenshots(job.id);
            if (screenshots) {
                return {
                    ...parsed,
                    screenshots
                };
            }
            return parsed;
        } catch (error) {
            this.cancelJob(job.id).catch(() => {});
            throw error;
        }
    }

    private async getJob(jobId: string) {
        const res = await this.sendRequest({
            method: 'GET',
            path: `jobs/${jobId}`
        });
        return res;
    }

    private async cancelJob(jobId: string) {
        return this.sendRequest({
            method: 'POST',
            path: `jobs/${jobId}/cancel`
        });
    }

    private async getJobOutputs(jobId: string): Promise<Array<Record<string, any>>> {
        const res = await this.sendRequest({
            method: 'GET',
            path: `jobs/${jobId}/outputs`
        });
        return res;
    }

    private parseJobOutputs(jobOutput: any): ScrapeResponse {
        const outputs = Array.isArray(jobOutput?.data) ? jobOutput.data : (Array.isArray(jobOutput) ? jobOutput : []);

        const pairs = outputs
            .filter((output: any) => output.key && output.data !== undefined)
            .map((output: any) => [output.key, output.data]);
        const result = Object.fromEntries(pairs);

        return {
            inputUrl: result.inputUrl || '',
            url: result.url || '',
            title: result.title || '',
            text: result.text || '',
            markdown: result.markdown || '',
            parsedJson: result.parsedJson || [],
            html: result.html || '',
            images: Array.isArray(result.images) ? result.images : [],
            links: Array.isArray(result.links) ? result.links : [],
            cookies: Array.isArray(result.cookies) ? result.cookies : []
        };
    }

    private async getJobScreenshots(jobId: string): Promise<string[]> {
        const screenshots = await this.sendRequest({
            method: 'GET',
            path: `jobs/${jobId}/screenshots`,
        });

        if (!screenshots || !screenshots.data) {
            return [];
        }

        const base64Screenshots = await Promise.all(
            screenshots.data.map(async (screenshot: Record<string, any>) => {
                try {
                    return await this.sendRequest({
                        method: 'GET',
                        path: `jobs/${jobId}/screenshots/${screenshot.id}`,
                    }, 'base64');
                } catch (error) {
                    console.error('Failed to fetch screenshot:', error);
                    return null;
                }
            })
        );

        return base64Screenshots.filter(Boolean) as string[];
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
