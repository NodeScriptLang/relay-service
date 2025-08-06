import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class GeminiLlmService extends LlmService {

    @config() LLM_GEMINI_API_KEY!: string;
    @config({ default: 'https://generativelanguage.googleapis.com/v1beta/' }) GEMINI_BASE_URL!: string;

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

    calculateCost(modelId: string, json: Record<string, any>, params: Record<string, any> = {}): number {
        const model = models.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Unsupported model: ${modelId}`);
        }

        // Handle per-image pricing for Imagen models
        if (model.modelType.includes(LlmModelType.IMAGE) && model.pricing.per_image !== undefined) {
            const imageCount = params.n || 1;
            return model.pricing.per_image * imageCount;
        }

        // Handle token-based pricing for other models
        const promptTokenCount = json.usageMetadata?.promptTokenCount || 0;
        const candidatesTokenCount = json.usageMetadata?.candidatesTokenCount || 0;
        const contextCachingTokenCount = json.usageMetadata?.contextCachingTokenCount || 0;

        const promptPrice = this.getPrice(model.pricing.promptTokenCount, promptTokenCount);
        const candidatesPrice = this.getPrice(model.pricing.candidatesTokenCount, candidatesTokenCount);
        const cachingPrice = this.getPrice(model.pricing.contextCachingTokenCount, contextCachingTokenCount);

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

    private getPrice(pricingObj: any, tokenCount: number): number {
        if (pricingObj.price !== undefined) {
            // Flat pricing
            return pricingObj.price;
        } else if (pricingObj.tiered_pricing) {
            // Tiered pricing
            return tokenCount <= 128000 ?
                pricingObj.tiered_pricing[0].price :
                pricingObj.tiered_pricing[1].price;
        }
        return 0;
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

// For more details on pricing, see: https://ai.google.dev/gemini-api/docs/pricing
const models = [
    {
        id: 'gemini-2.5-flash',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                price: 0.075
            },
            candidatesTokenCount: {
                price: 0.60
            },
            contextCachingTokenCount: {
                price: 0.01875
            },
            contextCachingStorage: 1.00
        }
    },
    {
        id: 'gemini-2.5-pro',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 200000,
                        price: 1.25
                    },
                    {
                        min_tokens: 200001,
                        price: 2.50
                    }
                ]
            },
            candidatesTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 200000,
                        price: 10.00
                    },
                    {
                        min_tokens: 200001,
                        price: 15.00
                    }
                ]
            },
            contextCachingTokenCount: {
                tiered_pricing: [
                    {
                        max_tokens: 200000,
                        price: 0.3125
                    },
                    {
                        min_tokens: 200001,
                        price: 0.625
                    }
                ]
            },
            contextCachingStorage: 4.50
        }
    },
    {
        id: 'gemini-2.5-flash-lite',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                price: 0.10
            },
            candidatesTokenCount: {
                price: 0.40
            },
            contextCachingTokenCount: {
                price: 0.025
            },
            contextCachingStorage: 1.00
        }
    },
    {
        id: 'gemini-2.0-flash-lite',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                price: 0.075
            },
            candidatesTokenCount: {
                price: 0.30
            },
            contextCachingTokenCount: {
                price: 0.01875
            },
            contextCachingStorage: 1.00
        }
    },
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
        id: 'gemini-2.0-flash-001',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.TEXT],
        pricing: {
            promptTokenCount: {
                price: 0.10
            },
            candidatesTokenCount: {
                price: 0.40
            },
            contextCachingTokenCount: {
                price: 0.025
            },
            contextCachingStorage: 1.00
        }
    },
    {
        id: 'gemini-2.0-flash-exp-image-generation',
        tokenDivisor: 1_000_000,
        modelType: [LlmModelType.IMAGE],
        pricing: {
            promptTokenCount: {
                price: 0.10
            },
            candidatesTokenCount: {
                price: 0.40
            },
            contextCachingTokenCount: {
                price: 0.025
            },
            contextCachingStorage: 1.00
        }
    },
    {
        id: 'imagen-3',
        tokenDivisor: 1,
        modelType: [LlmModelType.IMAGE],
        pricing: {
            per_image: 0.03
        }
    },
    {
        id: 'imagen-4',
        tokenDivisor: 1,
        modelType: [LlmModelType.IMAGE],
        pricing: {
            per_image: 0.04
        }
    }
];
