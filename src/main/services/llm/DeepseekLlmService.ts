import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructureData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class DeepseekLlmService extends LlmService {

    @config({ default: 'https://api.deepseek.com/v1' }) DEEPSEEK_BASE_URL!: string;
    @config({ default: 1_000_000 }) DEEPSEEK_PRICE_PER_TOKENS!: number;
    @config() LLM_DEEPSEEK_API_KEY!: string;

    getModels() {
        return models;
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

    async generateText(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('chat/completions', 'POST', body);
        const json = await res.json();
        return {
            content: json.choices[0].message.content,
            totalTokens: json.usage.total_tokens,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateStructuredData(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('chat/completions', 'POST', body);
        const json = await res.json();
        return {
            content: json.choices[0].message.content,
            totalTokens: json.usage.total_tokens,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateImage(req: LlmGenerateImage): Promise<LlmCompleteResponse> {
        const body = this.formatImageRequestBody(req);
        const res = await this.request('images/generations', 'POST', body);
        const json = await res.json();
        return {
            content: json.data[0].url,
            fullResponse: json,
            status: res.status,
        };
    }

    // Helpers

    private async request(path: string, method: string, body: Record<string, any>): Promise<Response> {
        const res = await fetch(`${this.DEEPSEEK_BASE_URL}${path}`, {
            method,
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
        return res;
    }

    private formatTextRequestBody(req: LlmGenerateText | LlmGenerateStructureData): Record<string, any> {
        let data = undefined;
        if ('data' in req) {
            data = JSON.stringify(req.data);
        }
        return {
            'model': req.model,
            'messages': [
                {
                    role: 'system',
                    content: req.system,
                },
                {
                    role: 'user',
                    content: req.prompt
                },
                (data ?? {
                    role: 'user',
                    conten: data
                })
            ],
            'max_tokens': req.params?.maxTokens,
            'temperature': req.params?.temperature,
            'top_p': req.params?.topP,
            'top_k': req.params?.topK,
            'stop': req.params?.stopSequences,
            'stream': req.params?.stream
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
