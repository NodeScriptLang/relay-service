import { LlmCompleteRequest, LlmCompleteResponse, LlmModelType, LlmTextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class AnthropicLlmService extends LlmService {

    @config({ default: 'https://api.anthropic.com/v1' }) ANTHROPIC_BASE_URL!: string;
    @config() LLM_ANTHROPIC_API_KEY!: string;

    getModels() {
        return models;
    }

    async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        const url = this.getRequestUrl(request.modelType);
        const body = this.getRequestBody(request.modelType, request.params);

        const res = await fetch(url, {
            method: request.method,
            headers: {
                'X-Api-Key': this.LLM_ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'Anthropic-Version': '2023-06-01',
                'Anthropic-Dangerous-Direct-Browser-Access': 'true'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`Anthropic API error: ${res.status} ${errorText}`);
            (error as any).status = res.status;
            throw error;
        }
        const json = await res.json();
        return this.getResponse(request.modelType, json);
    }

    protected getRequestUrl(modelType: string): string {
        if (modelType === LlmModelType.TEXT) {
            return `${this.ANTHROPIC_BASE_URL}/messages`;
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getResponse(modelType: string, json: Record<string, any>): LlmCompleteResponse {
        if (modelType === LlmModelType.TEXT) {
            return {
                content: json.content[0].text,
                totalTokens: json.usage.input_tokens + json.usage.output_tokens,
                fullResponse: json,
            };
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    calculateCost(modelType: string, modelId: string, json: Record<string, any>): number {
        if (modelType === LlmModelType.TEXT) {
            const model = models.text.find(m => m.id === modelId);
            if (!model) {
                throw new Error(`Unsupported model: ${modelId}`);
            }

            const inputTokens = json.usage?.input_tokens || 0;
            const outputTokens = json.usage?.output_tokens || 0;
            const cacheCreationInputTokens = json.usage?.cache_creation_input_tokens || 0;
            const cacheReadInputTokens = json.usage?.cache_read_input_tokens || 0;

            const regularInputTokens = inputTokens - cacheCreationInputTokens - cacheReadInputTokens;

            const inputCost = regularInputTokens * (model.pricing.input_tokens / 1000);
            const outputCost = outputTokens * (model.pricing.completion_tokens / 1000);
            const cacheCreationCost = cacheCreationInputTokens * (model.pricing.cache_creation_input_tokens / 1000);
            const cacheReadCost = cacheReadInputTokens * (model.pricing.cache_read_input_tokens / 1000);

            return inputCost + outputCost + cacheCreationCost + cacheReadCost;
        }
        return 0;
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
                    role: 'user',
                    content: `${params.userPrompt}${data ? `\n\n${data}` : ''}`
                },
            ],
            'max_tokens': params.maxTokens,
            'temperature': params.temperature,
            'top_p': params.topP,
            'top_k': params.topK,
            'stop_sequences': params.stopSequences,
            'stream': params.stream,
            'system': params.systemPrompt,
        };
    }

}

const models = {
    text: [
        {
            id: 'claude-3-7-sonnet-20250219',
            pricing: {
                'input_tokens': 3.00,
                'completion_tokens': 15.00,
                'cache_creation_input_tokens': 3.75,
                'cache_read_input_tokens': 0.30
            }
        },
        {
            id: 'claude-3-5-sonnet-20241022',
            pricing: {
                'input_tokens': 3.00,
                'completion_tokens': 15.00,
                'cache_creation_input_tokens': 3.75,
                'cache_read_input_tokens': 0.30
            }
        },
        {
            id: 'claude-3-5-haiku-20241022',
            pricing: {
                'input_tokens': 0.80,
                'completion_tokens': 4.00,
                'cache_creation_input_tokens': 1.00,
                'cache_read_input_tokens': 0.08
            }
        },
        {
            id: 'claude-3-5-sonnet-20240620',
            pricing: {
                'input_tokens': 3.00,
                'completion_tokens': 15.00,
                'cache_creation_input_tokens': 3.75,
                'cache_read_input_tokens': 0.30
            }
        },
        {
            id: 'claude-3-haiku-20240307',
            pricing: {
                'input_tokens': 0.25,
                'completion_tokens': 1.25,
                'cache_creation_input_tokens': 0.30,
                'cache_read_input_tokens': 0.03
            }
        },
        {
            id: 'claude-3-opus-20240229',
            pricing: {
                'input_tokens': 7.50,
                'completion_tokens': 37.50,
                'cache_creation_input_tokens': 9.38,
                'cache_read_input_tokens': 0.75
            }
        }
    ]
};
