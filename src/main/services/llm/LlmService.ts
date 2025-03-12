import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';

export abstract class LlmService {

    abstract complete(req: LlmCompleteRequest): Promise<Record<string, any>>;

    protected handleError(error: any): Record<string, any> {
        return {
            body: { error: error.message },
            status: 500,
        };
    }

}
