import { LlmCompleteRequest, LlmCompleteResponse, LlmDomain } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { AnthropicLlmService } from '../services/llm/AnthropicLlmService.js';
import { DeepseekLlmService } from '../services/llm/DeepseekLlmService.js';
import { GeminiLlmService } from '../services/llm/GeminiLlmService.js';
import { LlmService } from '../services/llm/LlmService.js';
import { OpenaAiLlmService } from '../services/llm/OpenaAiLlmService.js';

export class LlmDomainImpl implements LlmDomain {

    @dep() private anthropicLlmService!: AnthropicLlmService;
    @dep() private deepseekLlmService!: DeepseekLlmService;
    @dep() private geminiLlmService!: GeminiLlmService;
    @dep() private openaAiLlmService!: OpenaAiLlmService;

    private llmServices: Record<string, LlmService> = {};

    constructor() {
        this.llmServices = {
            'anthropic': this.anthropicLlmService,
            'deepseek': this.deepseekLlmService,
            'gemini': this.geminiLlmService,
            'openai': this.openaAiLlmService
        };
    }

    async complete(req: { request: LlmCompleteRequest }): Promise<{ response: LlmCompleteResponse }> {
        const { request } = req;
        const { providerId } = request;

        const service = this.llmServices[providerId];
        if (!service) {
            throw new Error(`Unsupported LLM provider: ${providerId}`);
        }

        try {
            const response = await service.complete(request);
            return { response };
        } catch (error) {
            const err = service.handleError(error);
            throw err;
        }
    }

}
