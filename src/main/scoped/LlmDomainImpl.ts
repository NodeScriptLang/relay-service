import { RateLimitExceededError } from '@nodescript/errors';
import { LlmCompleteResponse, LlmDomain, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { RedisManager } from '../global/RedisManager.js';
import { AnthropicLlmService } from '../services/llm/AnthropicLlmService.js';
import { DeepseekLlmService } from '../services/llm/DeepseekLlmService.js';
import { GeminiLlmService } from '../services/llm/GeminiLlmService.js';
import { GroqLlmService } from '../services/llm/GroqLlmService.js';
import { LlmService } from '../services/llm/LlmService.js';
import { OpenaAiLlmService } from '../services/llm/OpenaAiLlmService.js';
import { XAiLlmService } from '../services/llm/XAiLlmService.js';
import { calculateMillicredits } from '../utils/cost.js';
import { getDate, getHour, HOUR_SECONDS } from '../utils/date.js';
import { NodeScriptApi } from './NodeScriptApi.js';

export class LlmDomainImpl implements LlmDomain {

    @config() LLM_PRICE_PER_CREDIT!: number;

    @config({ default: 120 }) LLM_RATE_LIMIT!: number;
    @config({ default: HOUR_SECONDS }) LLM_RATE_LIMIT_TTL_SECONDS!: number;

    @dep() private nsApi!: NodeScriptApi;
    @dep() private redis!: RedisManager;

    @dep() private anthropicLlmService!: AnthropicLlmService;
    @dep() private deepseekLlmService!: DeepseekLlmService;
    @dep() private geminiLlmService!: GeminiLlmService;
    @dep() private groqLlmService!: GroqLlmService;
    @dep() private openaAiLlmService!: OpenaAiLlmService;
    @dep() private xaiLlmService!: XAiLlmService;

    private llmServices: Record<string, LlmService> = {};

    constructor() {
        this.llmServices = {
            'anthropic': this.anthropicLlmService,
            'deepseek': this.deepseekLlmService,
            'gemini': this.geminiLlmService,
            'groq': this.groqLlmService,
            'openai': this.openaAiLlmService,
            'xai': this.xaiLlmService
        };
    }

    async getModels(req: { modelType: LlmModelType }): Promise<{ models: string[] }> {
        const models = Object.values(this.llmServices)
            .flatMap(service => {
                const models = service.getModels();
                return models.filter((model: any) => model.modelType.includes(req.modelType)).map((model: any) => model.id);
            });
        return { models };
    }

    async generateText(req: { request: LlmGenerateText }): Promise<{ response: LlmCompleteResponse }> {
        const { model } = req.request;
        const providerId = this.getProviderForModel(model);
        if (!providerId) {
            throw new Error(`Unsupported LLM model: ${model}`);
        }

        const service = this.llmServices[providerId];
        if (!service) {
            throw new Error(`Unsupported LLM provider: ${providerId}`);
        }

        try {
            const workspaceId = await this.nsApi.getWorkspaceId();
            await this.handleRateLimit(workspaceId);

            const response = await service.generateText(req.request);

            const cost = service.calculateCost(req.request.model, response.fullResponse, req.request.params);
            const millicredits = calculateMillicredits(cost, this.LLM_PRICE_PER_CREDIT);
            const skuId = `llm:${providerId}:generateText:${model}`;
            const skuName = `${providerId}:generateText`;
            await this.nsApi.addUsage(millicredits, skuId, skuName, response.status);

            return { response };
        } catch (error) {
            const err = service.handleError(error);
            throw err;
        }
    }

    async generateStructuredData(req: { request: LlmGenerateStructuredData }): Promise<{ response: LlmCompleteResponse }> {
        const { model } = req.request;
        const providerId = this.getProviderForModel(model);
        if (!providerId) {
            throw new Error(`Unsupported LLM model: ${model}`);
        }

        const service = this.llmServices[providerId];
        if (!service) {
            throw new Error(`Unsupported LLM provider: ${providerId}`);
        }

        try {
            const workspaceId = await this.nsApi.getWorkspaceId();
            await this.handleRateLimit(workspaceId);

            const response = await service.generateStructuredData(req.request);

            const cost = service.calculateCost(req.request.model, response.fullResponse, req.request.params);
            const millicredits = calculateMillicredits(cost, this.LLM_PRICE_PER_CREDIT);
            const skuId = `llm:${providerId}:generateStructuredData:${model}`;
            const skuName = `${providerId}:generateStructuredData`;
            await this.nsApi.addUsage(millicredits, skuId, skuName, response.status);

            return { response };
        } catch (error) {
            const err = service.handleError(error);
            throw err;
        }
    }

    async generateImage(req: { request: LlmGenerateImage }): Promise<{ response: LlmCompleteResponse }> {
        const { model } = req.request;
        const providerId = this.getProviderForModel(model);
        if (!providerId) {
            throw new Error(`Unsupported LLM model: ${model}`);
        }

        const service = this.llmServices[providerId];
        if (!service) {
            throw new Error(`Unsupported LLM provider: ${providerId}`);
        }

        try {
            const workspaceId = await this.nsApi.getWorkspaceId();
            await this.handleRateLimit(workspaceId);

            const response = await service.generateImage(req.request);

            const cost = service.calculateCost(req.request.model, response.fullResponse, req.request.params);
            const millicredits = calculateMillicredits(cost, this.LLM_PRICE_PER_CREDIT);
            const skuId = `llm:${providerId}:generateImage:${model}`;
            const skuName = `${providerId}:generateImage`;
            await this.nsApi.addUsage(millicredits, skuId, skuName, response.status);

            return { response };
        } catch (error) {
            const err = service.handleError(error);
            throw err;
        }
    }

    private getProviderForModel(modelId: string): string | undefined {
        const modelMap = this.getAllModels();
        return modelMap[modelId];
    }

    private getAllModels(): Record<string, string> {
        const modelToProvider: Record<string, string> = {};

        for (const [providerId, service] of Object.entries(this.llmServices)) {
            const models = service.getModels();

            for (const model of Object.values(models)) {
                modelToProvider[model.id] = providerId;
            }
        }
        return modelToProvider;
    }

    private async handleRateLimit(workspaceId: string) {
        const date = getDate();
        const hour = getHour();
        const key = `Relay:llm:rateLimit:${workspaceId}:${date}:${hour}`;
        const currentCount = await this.redis.client.incr(key);
        if (currentCount === 1) {
            await this.redis.client.expire(key, this.LLM_RATE_LIMIT_TTL_SECONDS);
        }
        if (currentCount > this.LLM_RATE_LIMIT) {
            throw new RateLimitExceededError();
        }
    }

}
