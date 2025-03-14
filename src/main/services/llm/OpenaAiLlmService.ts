import { LlmCompleteRequest, LlmCompleteResponse, LlmImageModelParams, LlmModelType, LlmTextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class OpenaAiLlmService extends LlmService {

    @config({ default: 'https://api.openai.com/v1' }) OPENAI_BASE_URL!: string;
    @config({ default: 1_000_000 }) OPENAI_PRICE_PER_TOKENS!: number;

    @config() LLM_OPENAI_API_KEY!: string;

    getModels() {
        return models;
    }

    async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        const url = this.getRequestUrl(request.modelType);
        const body = this.getRequestBody(request.modelType, request.params);

        const res = await fetch(url, {
            method: request.method,
            headers: {
                'Authorization': `Bearer ${this.LLM_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`OpenAI API error: ${res.status} ${errorText}`);
            (error as any).status = res.status;
            throw error;
        }
        const json = await res.json();
        return this.getResponse(request.modelType, json);
    }

    protected getRequestUrl(modelType: string): string {
        if (modelType === LlmModelType.TEXT) {
            return `${this.OPENAI_BASE_URL}/chat/completions`;
        } else if (modelType === LlmModelType.IMAGE) {
            return `${this.OPENAI_BASE_URL}/images/generations`;
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    calculateCost(modelType: string, params: Record<string, any>, json: Record<string, any>): number {
        if (modelType === LlmModelType.TEXT) {
            const model = models.text.find(m => m.id === params.model);
            if (!model) {
                throw new Error(`Unsupported model: ${params.model}`);
            }

            const promptTokens = json.usage.prompt_tokens;
            const completionTokens = json.usage.completion_tokens;
            const cachedTokens = json.usage.prompt_tokens_details?.cached_tokens || 0;
            const nonCachedPromptTokens = promptTokens - cachedTokens;

            const promptCost = nonCachedPromptTokens * (model.pricing['input_tokens'] / this.OPENAI_PRICE_PER_TOKENS);
            const cachedCost = cachedTokens * (model.pricing['cached_input_tokens'] / this.OPENAI_PRICE_PER_TOKENS);
            const completionCost = completionTokens * (model.pricing['output_tokens'] / this.OPENAI_PRICE_PER_TOKENS);

            return promptCost + cachedCost + completionCost;
        }

        if (modelType === LlmModelType.IMAGE) {
            const model = models.image.find(m => m.id === params.model);
            if (!model) {
                throw new Error(`Unsupported model: ${params.model}`);
            }

            const size: ImageSize = params.size || '1024x1024';
            const quality: ImageQuality = params.quality || 'standard';
            const count = params.n || 1;

            if (model.id === 'dall-e-3') {
                // DALL-E 3 has different pricing for standard vs HD
                const qualityPricing = model.pricing[quality];
                if (!qualityPricing) {
                    throw new Error(`Unsupported quality: ${quality}`);
                }
                const sizePrice = qualityPricing[size] || 0;
                return sizePrice * count;
            }
            if (model.id === 'dall-e-2') {
                // DALL-E 2 has pricing by size only
                const sizePrice = model.pricing[size] || 0;
                return sizePrice * count;
            }
        }

        return 0;
    }

    protected getResponse(modelType: string, json: Record<string, any>): LlmCompleteResponse {
        if (modelType === LlmModelType.TEXT) {
            return {
                content: json.choices[0].message.content,
                totalTokens: json.usage.total_tokens,
                fullResponse: json,
            };
        } else if (modelType === LlmModelType.IMAGE) {
            return {
                content: json.data[0].url,
                fullResponse: json,
            };
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getRequestBody(modelType: string, params: any): Record<string, any> {
        if (modelType === LlmModelType.TEXT) {
            return this.formatTextRequestBody(params);
        } else if (modelType === LlmModelType.IMAGE) {
            return this.formatImageRequestBody(params);
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
                    content: `${params.userPrompt}${data ? `\n\n${data}` : ''}`,
                },
            ],
            'max_tokens': params.maxTokens,
            'temperature': params.temperature,
            'top_p': params.topP,
            'stop': params.stopSequences,
            'frequency_penalty': params.frequencyPenalty,
            'presence_penalty': params.presencePenalty,
            'logit_bias': params.logitBias,
            'response_format': params.responseFormat,
            'seed': params.seed,
            'stream': params.stream
        };
    }

    private formatImageRequestBody(params: Partial<LlmImageModelParams>): Record<string, any> {
        return {
            'model': params.model,
            'prompt': params.userPrompt,
            'n': params.n,
            'size': params.size,
            'style': params.style,
            'user': params.user,
            'response_format': params.responseFormat,
        };
    }

}

type ImageQuality = 'standard' | 'hd';
type ImageSize = '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';

const models = {
    text: [
        {
            id: 'gpt-4o',
            pricing: {
                'input_tokens': 2.50,
                'cached_input_tokens': 1.25,
                'output_tokens': 10.00
            }
        },
        {
            id: 'gpt-4o-mini',
            pricing: {
                'input_tokens': 0.15,
                'cached_input_tokens': 0.075,
                'output_tokens': 0.60
            }
        },
        {
            id: 'gpt-4-turbo',
            pricing: {
                'input_tokens': 0.03,
                'cached_input_tokens': 0.015,
                'output_tokens': 0.06
            }
        },
        {
            id: 'gpt-3.5-turbo',
            pricing: {
                'input_tokens': 0.015,
                'cached_input_tokens': 0.0075,
                'output_tokens': 0.020
            }
        }
    ],
    image: [
        {
            id: 'dall-e-3',
            pricing: {
                'standard': {
                    '1024x1024': 0.040,
                    '1024x1792': 0.080,
                    '1792x1024': 0.080,
                    '256x256': null,
                    '512x512': null
                },
                'hd': {
                    '1024x1024': 0.080,
                    '1024x1792': 0.120,
                    '1792x1024': 0.120,
                    '256x256': null,
                    '512x512': null
                }
            }
        },
        {
            id: 'dall-e-2',
            pricing: {
                '256x256': 0.016,
                '512x512': 0.018,
                '1024x1024': 0.020,
                '1024x1792': null,
                '1792x1024': null
            }
        }
    ]
};
