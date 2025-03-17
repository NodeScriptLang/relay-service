import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class GeminiLlmService extends LlmService {

    @config({ default: 'https://generativelanguage.googleapis.com/v1beta/' }) GEMINI_BASE_URL!: string;
    @config() LLM_GEMINI_API_KEY!: string;

    getModels() {
        return models;
    }

    async generateText(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('generateContent', req.model, 'POST', body);
        const json = await res.json();
        return {
            content: json.candidates[0].content.parts[0].text,
            totalTokens: json.usageMetadata.totalTokenCount,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateStructuredData(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('generateContent', req.model, 'POST', body);
        const json = await res.json();
        return {
            content: json.candidates[0].content.parts[0].text,
            totalTokens: json.usageMetadata.totalTokenCount,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateImage(req: LlmGenerateImage): Promise<LlmCompleteResponse> {
        const body = this.formatImageRequestBody(req);
        const res = await this.request('generateContent', req.model, 'POST', body);
        const json = await res.json();

        const candidate = json.candidates[0];
        const content = candidate.content;
        const imagePart = content.parts.find((part: any) => part.inlineData);
        const imageData = imagePart ? imagePart.inlineData.data : null;

        return {
            content: imageData,
            fullResponse: json,
            status: res.status,
        };
    }

    calculateCost(modelId: string, json: Record<string, any>): number {
        const model = models.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Unsupported model: ${modelId}`);
        }
        const promptTokenCount = json.usageMetadata?.promptTokenCount || 0;
        const candidatesTokenCount = json.usageMetadata?.candidatesTokenCount || 0;
        const contextCachingTokenCount = json.usageMetadata?.contextCachingTokenCount || 0;

        const promptPrice = promptTokenCount <= 128000 ?
            model.pricing.promptTokenCount.tiered_pricing[0].price :
            model.pricing.promptTokenCount.tiered_pricing[1].price;

        const candidatesPrice = candidatesTokenCount <= 128000 ?
            model.pricing.candidatesTokenCount.tiered_pricing[0].price :
            model.pricing.candidatesTokenCount.tiered_pricing[1].price;

        const cachingPrice = contextCachingTokenCount <= 128000 ?
            model.pricing.contextCachingTokenCount.tiered_pricing[0].price :
            model.pricing.contextCachingTokenCount.tiered_pricing[1].price;

        const promptCost = (promptTokenCount * promptPrice) / model.tokenDivisor;
        const candidatesCost = (candidatesTokenCount * candidatesPrice) / model.tokenDivisor;
        const cachingCost = (contextCachingTokenCount * cachingPrice) / model.tokenDivisor;

        return promptCost + candidatesCost + cachingCost;
    }

    // Helpers

    private async request(path: string, model: string, method: string, body: Record<string, any>): Promise<Response> {
        const url = new URL(`${this.GEMINI_BASE_URL}models/${model}:${path}`);
        url.searchParams.append('key', this.LLM_GEMINI_API_KEY);
        const res = await fetch(url, {
            method,
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
        return res;
    }

    private formatTextRequestBody(req: LlmGenerateText | LlmGenerateStructuredData): Record<string, any> {
        const parts = [
            { text: req.prompt }
        ];

        let data = undefined;
        if ('data' in req) {
            data = JSON.stringify(req.data);
        }
        if (data) {
            parts.push({ text: data });
        }

        return {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `System prompt: ${req.system}`
                        },
                    ]
                },
                {
                    role: 'user',
                    parts: parts
                }
            ],
            generationConfig: {
                responseModalities: ['Text'],
                maxOutputTokens: req.params?.maxTokens,
                temperature: req.params?.temperature,
                top_p: req.params?.topP,
                top_k: req.params?.topK,
                stop_sequences: req.params?.stopSequences,
            }
        };
    }

    private formatImageRequestBody(req: LlmGenerateImage): Record<string, any> {
        return {
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `System prompt: ${req.system}`
                        },
                    ]
                },
                {
                    role: 'user',
                    parts: [
                        {
                            text: req.prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                responseModalities: ['Text', 'Image']
            }
        };
    }

}

const models = [
    {
        id: 'gemini-2.0-pro-exp-02-05',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 1.25
                    },
                    {
                        min_tokens: 128001,
                        price: 2.50
                    }
                ]
            },
            candidatesTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 5.00
                    },
                    {
                        min_tokens: 128001,
                        price: 10.00
                    }
                ]
            },
            contextCachingTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.3125
                    },
                    {
                        min_tokens: 128001,
                        price: 0.625
                    }
                ]
            },
            contextCachingStorage: 4.50
        }
    },
    {
        id: 'gemini-1.5-pro-001',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 1.25
                    },
                    {
                        min_tokens: 128001,
                        price: 2.50
                    }
                ]
            },
            candidatesTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 5.00
                    },
                    {
                        min_tokens: 128001,
                        price: 10.00
                    }
                ]
            },
            contextCachingTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.3125
                    },
                    {
                        min_tokens: 128001,
                        price: 0.625
                    }
                ]
            },
            contextCachingStorage: 4.50
        }
    },
    {
        id: 'gemini-1.5-flash-001',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.075
                    },
                    {
                        min_tokens: 128001,
                        price: 0.15
                    }
                ]
            },
            candidatesTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.30
                    },
                    {
                        min_tokens: 128001,
                        price: 0.60
                    }
                ]
            },
            contextCachingTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.01875
                    },
                    {
                        min_tokens: 128001,
                        price: 0.0375
                    }
                ]
            },
            contextCachingStorage: 1.00
        }
    },
    {
        id: 'gemini-2.0-flash-exp-image-generation',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT, LlmModelType.IMAGE],
        pricing: {
            promptTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.075
                    },
                    {
                        min_tokens: 128001,
                        price: 0.15
                    }
                ]
            },
            candidatesTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.30
                    },
                    {
                        min_tokens: 128001,
                        price: 0.60
                    }
                ]
            },
            contextCachingTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 128000,
                        price: 0.01875
                    },
                    {
                        min_tokens: 128001,
                        price: 0.0375
                    }
                ]
            },
            contextCachingStorage: 1.00
        }
    }
];
