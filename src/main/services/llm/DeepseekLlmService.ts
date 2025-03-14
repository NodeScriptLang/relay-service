import { LlmCompleteRequest, LlmCompleteResponse, LlmModelType, LlmTextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class DeepseekLlmService extends LlmService {

    @config({ default: 'https://api.deepseek.com/v1' }) DEEPSEEK_BASE_URL!: string;
    @config({ default: 1_000_000 }) DEEPSEEK_PRICE_PER_TOKENS!: number;
    @config() LLM_DEEPSEEK_API_KEY!: string;

    getModels() {
        return models;
    }

    async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        const url = this.getRequestUrl(request.modelType);
        const body = this.getRequestBody(request.modelType, request.params);

        const res = await fetch(url, {
            method: request.method,
            headers: {
                'Authorization': `Bearer ${this.LLM_DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`DeepSeek API error: ${res.status} ${errorText}`);
            (error as any).status = res.status;
            throw error;
        }
        const json = await res.json();
        return this.getResponse(request.modelType, json);
    }

    calculateCost(modelType: string, params: Record<string, any>, json: Record<string, any>): number {
        if (modelType === LlmModelType.TEXT) {
            const model = models.text.find(m => m.id === params.model);
            if (!model) {
                throw new Error(`Unsupported model: ${params.model}`);
            }

            const pricingTier = 'standard'; // Default to standard pricing for simplicity
            const pricing = model.pricing[pricingTier];

            const promptCacheHitTokens = json.prompt_cache_hit_tokens || json.usage?.prompt_tokens_details?.cached_tokens || 0;
            const promptCacheMissTokens = json.prompt_cache_miss_tokens ||
                (json.usage?.prompt_tokens - (json.usage?.prompt_tokens_details?.cached_tokens || 0));
            const completionTokens = json.usage?.completion_tokens || 0;

            const cacheHitCost = promptCacheHitTokens * (pricing.prompt_cache_hit_tokens / this.DEEPSEEK_PRICE_PER_TOKENS);
            const cacheMissCost = promptCacheMissTokens * (pricing.prompt_cache_miss_tokens / this.DEEPSEEK_PRICE_PER_TOKENS);
            const completionCost = completionTokens * (pricing.completion_tokens / this.DEEPSEEK_PRICE_PER_TOKENS);

            return cacheHitCost + cacheMissCost + completionCost;
        }
        return 0;
    }

    protected getRequestUrl(modelType: string): string {
        if (modelType === LlmModelType.TEXT) {
            return `${this.DEEPSEEK_BASE_URL}/chat/completions`;
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getResponse(modelType: string, json: Record<string, any>): LlmCompleteResponse {
        if (modelType === LlmModelType.TEXT) {
            return {
                content: json.choices[0].message.content,
                totalTokens: json.usage.total_tokens,
                fullResponse: json,
            };
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getRequestBody(modelType: string, params: any): Record<string, any> {
        if (modelType === LlmModelType.TEXT) {
            return this.formatTextRequestBody(params);
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    private formatTextRequestBody(params: Partial<LlmTextModelParams>): Record<string, any> {
        const data = JSON.stringify(params.data);
        return {
            'model': params.model,
            'messages': [
                {
                    role: 'system',
                    content: params.systemPrompt,
                },
                {
                    role: 'user',
                    content: `${params.userPrompt}${data ? `\n\n${data}` : ''}`
                },
            ],
            'max_tokens': params.maxTokens,
            'temperature': params.temperature,
            'top_p': params.topP,
            'top_k': params.topK,
            'stop': params.stopSequences,
            'stream': params.stream
        };
    }

}

// TODO simplify pricing
const models = {
    text: [
        {
            id: 'deepseek-chat',
            pricing: {
                'standard': {
                    'prompt_cache_hit_tokens': 0.07,
                    'prompt_cache_miss_tokens': 0.27,
                    'completion_tokens': 1.10
                },
                'discount': {
                    'prompt_cache_hit_tokens': 0.035,
                    'prompt_cache_miss_tokens': 0.135,
                    'completion_tokens': 0.55
                }
            }
        },
        {
            id: 'deepseek-reasoner',
            pricing: {
                'standard': {
                    'prompt_cache_hit_tokens': 0.14,
                    'prompt_cache_miss_tokens': 0.55,
                    'completion_tokens': 2.19
                },
                'discount': {
                    'prompt_cache_hit_tokens': 0.07,
                    'prompt_cache_miss_tokens': 0.275,
                    'completion_tokens': 1.10
                }
            }
        }
    ]
};
