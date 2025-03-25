import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class OpenaAiLlmService extends LlmService {

    @config() LLM_OPENAI_API_KEY!: string;
    @config({ default: 'https://api.openai.com/v1/' }) OPENAI_BASE_URL!: string;

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
            content: json.data[0].b64_json || json.data[0].url,
            fullResponse: json,
            status: res.status,
        };
    }

    calculateCost(modelId: string, json: Record<string, any>, params: Record<string, any>): number {
        const model = models.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Unsupported model: ${modelId}`);
        }

        if (model.modelType.includes(LlmModelType.TEXT)) {
            const textModel = model as TextModel;

            const promptTokens = json.usage.prompt_tokens;
            const completionTokens = json.usage.completion_tokens;
            const cachedTokens = json.usage.prompt_tokens_details?.cached_tokens || 0;
            const nonCachedPromptTokens = promptTokens - cachedTokens;

            const promptCost = nonCachedPromptTokens * (textModel.pricing['input_tokens'] / model.tokenDivisor);
            const cachedCost = cachedTokens * (textModel.pricing['cached_input_tokens'] / model.tokenDivisor);
            const completionCost = completionTokens * (textModel.pricing['output_tokens'] / model.tokenDivisor);

            return promptCost + cachedCost + completionCost;
        }

        if (model.modelType.includes(LlmModelType.IMAGE)) {
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
                    content: req.prompt,
                },
                ...(data ?
                    [{
                        role: 'user',
                        content: data
                    }] :
                    [])
            ],
            max_tokens: req.params?.maxTokens,
            temperature: req.params?.temperature,
            top_p: req.params?.topP,
            stop: req.params?.stopSequences,
            frequency_penalty: req.params?.frequencyPenalty,
            presence_penalty: req.params?.presencePenalty,
            logit_bias: req.params?.logitBias,
            response_format: req.params?.responseFormat,
            seed: req.params?.seed,
            stream: req.params?.stream
        };
    }

    private formatImageRequestBody(req: LlmGenerateImage): Record<string, any> {
        return {
            model: req.model,
            prompt: req.prompt,
            n: req.params?.n,
            size: req.params?.size,
            style: req.params?.style,
            user: req.params?.user,
            response_format: req.params?.responseFormat || 'b64_json',
        };
    }

}

type ImageQuality = 'standard' | 'hd';
type ImageSize = '256x256' | '512x512' | '1024x1024' | '1024x1792' | '1792x1024';

interface TextModel {
    id: string;
    modelType: LlmModelType[];
    tokenDivisor: number;
    pricing: {
        input_tokens: number;
        cached_input_tokens: number;
        output_tokens: number;
    };
}

// For more details on pricing, see: https://platform.openai.com/docs/pricing
const models = [
    {
        id: 'gpt-4o',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 2.50,
            cached_input_tokens: 1.25,
            output_tokens: 10.00
        }
    },
    {
        id: 'gpt-4o-mini',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.15,
            cached_input_tokens: 0.075,
            output_tokens: 0.60
        }
    },
    {
        id: 'gpt-4-turbo',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.03,
            cached_input_tokens: 0.015,
            output_tokens: 0.06
        }
    },
    {
        id: 'gpt-3.5-turbo',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.015,
            cached_input_tokens: 0.0075,
            output_tokens: 0.020
        }
    },
    {
        id: 'dall-e-3',
        modelType: [LlmModelType.IMAGE],
        tokenDivisor: 1,
        pricing: {
            standard: {
                '1024x1024': 0.040,
                '1024x1792': 0.080,
                '1792x1024': 0.080,
                '256x256': null,
                '512x512': null
            },
            hd: {
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
        modelType: [LlmModelType.IMAGE],
        tokenDivisor: 1,
        pricing: {
            '256x256': 0.016,
            '512x512': 0.018,
            '1024x1024': 0.020,
            '1024x1792': null,
            '1792x1024': null
        }
    }
];
