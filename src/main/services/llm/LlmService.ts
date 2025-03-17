import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText } from '@nodescript/relay-protocol';

export abstract class LlmService {

    abstract getModels(): Array<Record<string, any>>;

    abstract generateText(request: LlmGenerateText): Promise<LlmCompleteResponse>;
    abstract generateStructuredData(request: LlmGenerateStructuredData): Promise<LlmCompleteResponse>;
    abstract generateImage(request: LlmGenerateImage): Promise<LlmCompleteResponse>;

    abstract calculateCost(modelType: string, json: Record<string, any>, params?: Record<string, any>): number;

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
