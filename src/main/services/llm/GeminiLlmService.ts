import { LlmCompleteRequest, LlmCompleteResponse, LlmModelType, LlmTextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class GeminiLlmService extends LlmService {

    @config({ default: 'https://generativelanguage.googleapis.com/v1beta' }) GEMINI_BASE_URL!: string;
    @config() LLM_GEMINI_API_KEY!: string;

    getModels() {
        return models;
    }

    async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        const url = this.getRequestUrl(request.modelType, request.params.model);
        const body = this.getRequestBody(request.modelType, request.params);

        const res = await fetch(url, {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`Gemini API error: ${res.status} ${errorText}`);
            (error as any).status = res.status;
            throw error;
        }
        const json = await res.json();
        return this.getResponse(request.modelType, json);
    }

    protected getRequestUrl(modelType: string, model: string): string {
        if (modelType === LlmModelType.TEXT) {
            const url = new URL(`${this.GEMINI_BASE_URL}/models/${model}:generateContent`);
            url.searchParams.append('key', this.LLM_GEMINI_API_KEY);
            return url.toString();
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getResponse(modelType: string, json: Record<string, any>): LlmCompleteResponse {
        if (modelType === LlmModelType.TEXT) {
            return {
                content: json.candidates[0].content.parts[0].text,
                totalTokens: json.usageMetadata.totalTokenCount,
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
            'contents': [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${params.systemPrompt}\n\n${params.userPrompt}${data ? `\n\n${data}` : ''}`
                        }
                    ]
                },
            ],
            'generationConfig': {
                'maxOutputTokens': params.maxTokens,
                'temperature': params.temperature,
                'top_p': params.topP,
                'top_k': params.topK,
                'stop_sequences': params.stopSequences,
            }
        };
    }

}

// TODO simplify pricing
const models = {
    text: [
        {
            id: 'gemini-2.0-pro-exp-02-05',
            pricing: {
                'promptTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 1.25
                        },
                        {
                            'min_tokens': 128001,
                            'price': 2.50
                        }
                    ]
                },
                'candidatesTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 5.00
                        },
                        {
                            'min_tokens': 128001,
                            'price': 10.00
                        }
                    ]
                },
                'contextCachingTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 0.3125
                        },
                        {
                            'min_tokens': 128001,
                            'price': 0.625
                        }
                    ]
                },
                'contextCachingStorage': 4.50
            }
        },
        {
            id: 'gemini-1.5-pro-001',
            pricing: {
                'promptTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 1.25
                        },
                        {
                            'min_tokens': 128001,
                            'price': 2.50
                        }
                    ]
                },
                'candidatesTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 5.00
                        },
                        {
                            'min_tokens': 128001,
                            'price': 10.00
                        }
                    ]
                },
                'contextCachingTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 0.3125
                        },
                        {
                            'min_tokens': 128001,
                            'price': 0.625
                        }
                    ]
                },
                'contextCachingStorage': 4.50
            }
        },
        {
            id: 'gemini-1.5-flash-001',
            pricing: {
                'promptTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 0.075
                        },
                        {
                            'min_tokens': 128001,
                            'price': 0.15
                        }
                    ]
                },
                'candidatesTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 0.30
                        },
                        {
                            'min_tokens': 128001,
                            'price': 0.60
                        }
                    ]
                },
                'contextCachingTokenCount': {
                    'tiered_pricing': [
                        {
                            'max_tokens': 128000,
                            'price': 0.01875
                        },
                        {
                            'min_tokens': 128001,
                            'price': 0.0375
                        }
                    ]
                },
                'contextCachingStorage': 1.00
            }
        }
    ]
};
