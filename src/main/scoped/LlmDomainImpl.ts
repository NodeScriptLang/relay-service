import { Logger } from '@nodescript/logger';
import { LlmCompleteRequest, LlmCompleteResponse, LlmDomain } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { AnthropicLlmService } from '../services/llm/AnthropicLlmService.js';
import { DeepseekLlmService } from '../services/llm/DeepseekLlmService.js';
import { GeminiLlmService } from '../services/llm/GeminiLlmService.js';
import { LlmService } from '../services/llm/LlmService.js';
import { OpenaAiLlmService } from '../services/llm/OpenaAiLlmService.js';

export class LlmDomainImpl implements LlmDomain {

    @dep() private logger!: Logger;
    @dep() private anthropicLlmService!: AnthropicLlmService;
    @dep() private deepseekLlmService!: DeepseekLlmService;
    @dep() private geminiLlmService!: GeminiLlmService;
    @dep() private openaAiLlmService!: OpenaAiLlmService;

    private llmServices: Record<string, LlmService> = {};

    async init() {
        this.llmServices = {
            'anthropic': this.anthropicLlmService,
            'deepseek': this.deepseekLlmService,
            'gemini': this.geminiLlmService,
            'openai': this.openaAiLlmService
        };
        this.logger.info('LLM services initialized');
    }

    async complete(req: { request: LlmCompleteRequest }): Promise<{ response: LlmCompleteResponse }> {
        if (Object.keys(this.llmServices).length === 0) {
            await this.init();
        }

        const { request } = req;
        const { providerId, modelType } = request;

        this.logger.debug('Processing LLM request', { providerId, modelType });

        const service = this.llmServices[providerId];
        if (!service) {
            throw new Error(`Unsupported LLM provider: ${providerId}`);
        }

        const response = await service.complete(request);
        return { response };
    }

}
