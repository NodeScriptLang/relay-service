import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class AnthropicLlmService extends LlmService {

    @config() LLM_ANTHROPIC_API_KEY!: string;
    @config({ default: 'https://api.anthropic.com/v1/' }) ANTHROPIC_BASE_URL!: string;
    @config({ default: 4096 }) DEFAULT_MAX_TOKENS!: number;

    getModels() {
        return models;
    }

    async generateText(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('messages', 'POST', body);
        const json = await res.json();
        return {
            content: json.content[0].text,
            totalTokens: json.usage.input_tokens + json.usage.output_tokens,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateStructuredData(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('messages', 'POST', body);
        const json = await res.json();
        return {
            content: json.content[0].text,
            totalTokens: json.usage.input_tokens + json.usage.output_tokens,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateImage(_req: LlmGenerateImage): Promise<LlmCompleteResponse> {
        return {
            content: 'Image generation is not supported by Anthropic models. Please select a different model.',
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

        const inputTokens = json.usage?.input_tokens || 0;
        const outputTokens = json.usage?.output_tokens || 0;
        const cacheCreationInputTokens = json.usage?.cache_creation_input_tokens || 0;
        const cacheReadInputTokens = json.usage?.cache_read_input_tokens || 0;

        const regularInputTokens = inputTokens - cacheCreationInputTokens - cacheReadInputTokens;

        const inputCost = regularInputTokens * (model.pricing.input_tokens / model.tokenDivisor);
        const outputCost = outputTokens * (model.pricing.completion_tokens / model.tokenDivisor);
        const cacheCreationCost = cacheCreationInputTokens * (model.pricing.cache_creation_input_tokens / model.tokenDivisor);
        const cacheReadCost = cacheReadInputTokens * (model.pricing.cache_read_input_tokens / model.tokenDivisor);

        return inputCost + outputCost + cacheCreationCost + cacheReadCost;
    }

    // Helpers

    private async request(path: string, method: string, body: Record<string, any>): Promise<Response> {
        const res = await fetch(`${this.ANTHROPIC_BASE_URL}${path}`, {
            method,
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
        return res;
    }

    private formatTextRequestBody(req: LlmGenerateText | LlmGenerateStructuredData): Record<string, any> {
        let data = undefined;
        if ('data' in req) {
            data = JSON.stringify(req.data);
        }

        const model = models.find(m => m.id === req.model);
        const maxTokens = req.params?.maxTokens || model?.maxOutputTokens || this.DEFAULT_MAX_TOKENS;

        return {
            model: req.model,
            messages: [
                {
                    role: 'user',
                    content: `${req.prompt}`
                },
                ...(data ?
                    [{
                        role: 'user',
                        content: data
                    }] :
                    [])
            ],
            max_tokens: maxTokens,
            temperature: req.params?.temperature,
            top_p: req.params?.topP,
            top_k: req.params?.topK,
            stop_sequences: req.params?.stopSequences,
            stream: req.params?.stream,
            system: req.system,
            thinking: {
                type: 'disabled'
            }
        };
    }

}

// For more details on pricing, see: https://www.anthropic.com/pricing#anthropic-api
const models = [
    {
        id: 'claude-opus-4-20250514',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 4096,
        pricing: {
            input_tokens: 15.00,
            completion_tokens: 75.00,
            cache_creation_input_tokens: 18.75,
            cache_read_input_tokens: 1.50
        }
    },
    {
        id: 'claude-sonnet-4-20250514',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 8192,
        pricing: {
            input_tokens: 3.00,
            completion_tokens: 15.00,
            cache_creation_input_tokens: 3.75,
            cache_read_input_tokens: 0.30
        }
    },
    {
        id: 'claude-3-7-sonnet-20250219',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 8192,
        pricing: {
            input_tokens: 3.00,
            completion_tokens: 15.00,
            cache_creation_input_tokens: 3.75,
            cache_read_input_tokens: 0.30
        }
    },
    {
        id: 'claude-3-5-sonnet-20241022',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 8192,
        pricing: {
            input_tokens: 3.00,
            completion_tokens: 15.00,
            cache_creation_input_tokens: 3.75,
            cache_read_input_tokens: 0.30
        }
    },
    {
        id: 'claude-3-5-haiku-20241022',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 8192,
        pricing: {
            input_tokens: 0.80,
            completion_tokens: 4.00,
            cache_creation_input_tokens: 1.00,
            cache_read_input_tokens: 0.08
        }
    },
    {
        id: 'claude-3-5-sonnet-20240620',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 8192,
        pricing: {
            input_tokens: 3.00,
            completion_tokens: 15.00,
            cache_creation_input_tokens: 3.75,
            cache_read_input_tokens: 0.30
        }
    },
    {
        id: 'claude-3-haiku-20240307',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        maxOutputTokens: 4096,
        pricing: {
            input_tokens: 0.25,
            completion_tokens: 1.25,
            cache_creation_input_tokens: 0.30,
            cache_read_input_tokens: 0.03
        }
    },
    {
        id: 'claude-3-opus-20240229',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 7.50,
            completion_tokens: 37.50,
            cache_creation_input_tokens: 9.38,
            cache_read_input_tokens: 0.75
        }
    }
];
