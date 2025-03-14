import { LlmCompleteRequest, LlmCompleteResponse, LlmModelType, LlmTextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class DeepseekLlmService extends LlmService {

    @config({ default: 'https://api.deepseek.com/v1' }) DEEPSEEK_BASE_URL!: string;
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
