import { LlmCompleteRequest, LlmCompleteResponse } from '@nodescript/relay-protocol';

export abstract class LlmService {

    abstract getModels(): Record<string, any>;
    abstract complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse>;

    protected abstract getRequestUrl(modelType: string, model?: string): string;
    protected abstract getResponse(modelType: string, json: Record<string, any>): LlmCompleteResponse;
    protected abstract getRequestBody(modelType: string, params: any): Record<string, any>;

    handleError(error: any): Error {
        const err: any = new Error(error.message || 'Unknown LLM service error');
        err.originalError = error;
        err.code = error.code || 'UNKNOWN_ERROR';
        err.type = error.name || 'Error';
        err.status = error.status || 500;
        err.details = error.details || {};
        if (error.response) {
            err.responseStatus = error.response.status;
            err.responseBody = error.response.body;
        }
        return err;
    }

}
