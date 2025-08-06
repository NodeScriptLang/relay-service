import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class DeepseekLlmService extends LlmService {

    @config() LLM_DEEPSEEK_API_KEY!: string;
    @config({ default: 'https://api.deepseek.com/v1/' }) DEEPSEEK_BASE_URL!: string;
    @config({ default: 1_000_000 }) DEEPSEEK_PRICE_PER_TOKENS!: number;
    @config({ default: 4096 }) DEFAULT_MAX_TOKENS!: number;

    getModels() {
        return models;
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

    async generateImage(_req: LlmGenerateImage): Promise<LlmCompleteResponse> {
        return {
            content: 'Image generation is not supported by DeepSeek models. Please select a different model.',
            fullResponse: {
                error: 'Image generation not supported',
                suggestion: 'Use models like OpenAI\'s DALL-E for image generation tasks.'
            },
            status: 400,
        };
    }

    calculateCost(modelId: string, json: Record<string, any>): number {
        const model = models.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Unsupported model: ${modelId}`);
        }

        const promptCacheHitTokens = json.prompt_cache_hit_tokens || json.usage?.prompt_tokens_details?.cached_tokens || 0;
        const promptCacheMissTokens = json.prompt_cache_miss_tokens ||
            (json.usage?.prompt_tokens - (json.usage?.prompt_tokens_details?.cached_tokens || 0));
        const completionTokens = json.usage?.completion_tokens || 0;

        const cacheHitCost = promptCacheHitTokens * (model.pricing.prompt_cache_hit_tokens / model.tokenDivisor);
        const cacheMissCost = promptCacheMissTokens * (model.pricing.prompt_cache_miss_tokens / model.tokenDivisor);
        const completionCost = completionTokens * (model.pricing.completion_tokens / model.tokenDivisor);

        return cacheHitCost + cacheMissCost + completionCost;
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

    private formatTextRequestBody(req: LlmGenerateText | LlmGenerateStructuredData): Record<string, any> {
        let data = undefined;
        if ('data' in req) {
            data = JSON.stringify(req.data);
        }
        return {
            model: req.model,
            messages: [
                {
                    role: 'system',
                    content: req.system,
                },
                {
                    role: 'user',
                    content: req.prompt
                },
                ...(data ?
                    [{
                        role: 'user',
                        content: data
                    }] :
                    [])
            ],
            max_tokens: req.params?.maxTokens || this.DEFAULT_MAX_TOKENS,
            temperature: req.params?.temperature,
            top_p: req.params?.topP,
            top_k: req.params?.topK,
            stop: req.params?.stopSequences,
            stream: req.params?.stream
        };
    }

}

// Simplified pricing, check https://api-docs.deepseek.com/quick_start/pricing for more details
const models = [
    {
        id: 'deepseek-chat',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            prompt_cache_hit_tokens: 0.07,
            prompt_cache_miss_tokens: 0.27,
            completion_tokens: 1.10
        }
    },
    {
        id: 'deepseek-reasoner',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            prompt_cache_hit_tokens: 0.14,
            prompt_cache_miss_tokens: 0.55,
            completion_tokens: 2.19
        }
    }
];
