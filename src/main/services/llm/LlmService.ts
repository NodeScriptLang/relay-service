import { LlmCompleteRequest, LlmCompleteResponse } from '@nodescript/relay-protocol';

export abstract class LlmService {

    abstract complete(llmReq: LlmCompleteRequest): Promise<LlmCompleteResponse>;

    handleError(error: any): LlmCompleteResponse {
        return {
            body: {
                error: error.message,
                code: error.code || 'UNKNOWN_ERROR',
                type: error.name || 'Error'
            },
            status: error.status || 500,
            headers: {},
            endpointUrl: '',
        };
    }

}
