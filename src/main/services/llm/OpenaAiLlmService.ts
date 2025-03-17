import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructureData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class OpenaAiLlmService extends LlmService {

    @config({ default: 'https://api.openai.com/v1/' }) OPENAI_BASE_URL!: string;
    @config({ default: 1_000_000 }) OPENAI_PRICE_PER_TOKENS!: number;

    @config() LLM_OPENAI_API_KEY!: string;

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

    // Helpers

    private async request(path: string, method: string, body: Record<string, any>): Promise<Response> {
        const res = await fetch(`${this.OPENAI_BASE_URL}${path}`, {
            method,
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
                    content: req.prompt,
                },
                (data ?? {
                    role: 'user',
                    content: data
                })
            ],
            'max_tokens': req.params?.maxTokens,
            'temperature': req.params?.temperature,
            'top_p': req.params?.topP,
            'stop': req.params?.stopSequences,
            'frequency_penalty': req.params?.frequencyPenalty,
            'presence_penalty': req.params?.presencePenalty,
            'logit_bias': req.params?.logitBias,
            'response_format': req.params?.responseFormat,
            'seed': req.params?.seed,
            'stream': req.params?.stream
        };
    }

    private formatImageRequestBody(req: LlmGenerateImage): Record<string, any> {
        return {
            'model': req.model,
            'prompt': req.prompt,
            'n': req.params?.n,
            'size': req.params?.size,
            'style': req.params?.style,
            'user': req.params?.user,
            'response_format': req.params?.responseFormat,
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
