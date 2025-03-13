import { LlmCompleteRequest, LlmCompleteResponse } from '@nodescript/relay-protocol';

export abstract class LlmService {

    abstract complete(llmReq: LlmCompleteRequest): Promise<LlmCompleteResponse>;

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
