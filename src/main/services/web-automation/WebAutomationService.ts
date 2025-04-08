import { ScrapeWebpage } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

export interface AutomationCloudRequest {
    method: string;
    path: string;
    body?: Record<string, any>;
}

export class WebAutomationService {

    @config() WEB_AUTOMATION_AC_SECRET_KEY!: string;
    @config() WEB_AUTOMATION_AC_SERVICE_ID!: string;
    @config() WEB_AUTOMATION_AC_ORGANISATION_ID!: string;
    @config({ default: 'https://api.automationcloud.net' }) WEB_AUTOMATION_AC_API_URL!: string;

    async scrapeWebpage(request: ScrapeWebpage) {
        const res = await this.sendRequest({
            method: 'POST',
            path: 'jobs',
            body: {
                input: {
                    url: request.url,
                    proxyUrl: request.proxyUrl,
                    javascript: request.javascript,
                    sleep: request.sleep,
                    cookies: request.cookies,
                },
                serviceId: this.WEB_AUTOMATION_AC_SERVICE_ID,
                category: 'live',
            }
        });
        return res;
    }

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

    async getOutput(jobId: string) {
        const res = await this.sendRequest({
            method: 'GET',
            path: `jobs/${jobId}/outputs`
        });
        return res;
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
