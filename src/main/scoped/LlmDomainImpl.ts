import { LlmCompleteRequest, LlmCompleteResponse, LlmDomain, LlmModelType } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { AnthropicLlmService } from '../services/llm/AnthropicLlmService.js';
import { DeepseekLlmService } from '../services/llm/DeepseekLlmService.js';
import { GeminiLlmService } from '../services/llm/GeminiLlmService.js';
import { LlmService } from '../services/llm/LlmService.js';
import { OpenaAiLlmService } from '../services/llm/OpenaAiLlmService.js';
import { NodeScriptApi } from './NodeScriptApi.js';

export class LlmDomainImpl implements LlmDomain {

    @dep() private nsApi!: NodeScriptApi;
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

    async getModels(req: { modelType: LlmModelType }): Promise<{ models: string[] }> {
        const models = Object.values(this.llmServices)
            .flatMap(service => {
                const models = service.getModels()[req.modelType] || [];
                return models.map((model: any) => model.id);
            });
        return { models };
    }

    async complete(req: { request: LlmCompleteRequest }): Promise<{ response: LlmCompleteResponse }> {
        const { modelType, params } = req.request;
        const providerId = this.getProviderForModel(params.model);
        if (!providerId) {
            throw new Error(`Unsupported LLM model: ${params.model}`);
        }

        const service = this.llmServices[providerId];
        if (!service) {
            throw new Error(`Unsupported LLM provider: ${providerId}`);
        }

        try {
            const response = await service.complete(req.request);

            const cost = service.calculateCost(modelType, params, response.fullResponse);
            const millicredits = this.calculateMillicredits(cost);
            const skuId = `llm:${providerId}:${modelType}:${params.model}`;
            const skuName = `${providerId}:${modelType}`;
            this.nsApi.addUsage(millicredits, skuId, skuName, response.status);

            return { response };
        } catch (error) {
            const err = service.handleError(error);
            throw err;
        }
    }

    getProviderForModel(modelId: string): string | undefined {
        const modelMap = this.getAllModels();
        return modelMap[modelId];
    }

    private calculateMillicredits(cost: number): number {
        // TODO actual cost conversion
        return Math.ceil(cost * 1000);
    }

    private getAllModels(): Record<string, string> {
        const modelToProvider: Record<string, string> = {};

        for (const [providerId, service] of Object.entries(this.llmServices)) {
            const allModelTypes = service.getModels();

            for (const models of Object.values(allModelTypes)) {
                if (Array.isArray(models)) {
                    for (const model of models) {
                        modelToProvider[model.id] = providerId;
                    }
                }
            }
        }
        return modelToProvider;
    }

}
