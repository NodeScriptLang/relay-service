import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class PerplexityLlmService extends LlmService {

    @config({ default: 'https://api.perplexity.ai/' }) PERPLEXITY_BASE_URL!: string;
    @config() LLM_PERPLEXITY_API_KEY!: string;

    getModels() {
        return models;
    }

    async generateText(req: LlmGenerateText): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('chat/completions', 'POST', body);
        const json = await res.json();
        return {
            content: json.choices[0].message.content,
            totalTokens: json.usage?.total_tokens || 0,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateStructuredData(req: LlmGenerateStructuredData): Promise<LlmCompleteResponse> {
        const body = this.formatTextRequestBody(req);
        const res = await this.request('chat/completions', 'POST', body);
        const json = await res.json();
        return {
            content: json.choices[0].message.content,
            totalTokens: json.usage?.total_tokens || 0,
            fullResponse: json,
            status: res.status,
        };
    }

    async generateImage(_req: LlmGenerateImage): Promise<LlmCompleteResponse> {
        return {
            content: 'Image generation is not supported by Perplexity models. Please select a different model.',
            fullResponse: {
                error: 'Image generation not supported',
                suggestion: 'Use models like OpenAI\'s DALL-E for image generation tasks.'
            },
            status: 400,
        };
    }

    calculateCost(modelId: string, json: Record<string, any>, _params: Record<string, any>): number {
        const model = models.find(m => m.id === modelId);
        if (!model) {
            throw new Error(`Unsupported model: ${modelId}`);
        }

        if (model.modelType.includes(LlmModelType.TEXT)) {
            const textModel = model as TextModel;
            let cost = 0;

            const inputTokens = json.usage?.prompt_tokens || 0;
            const outputTokens = json.usage?.completion_tokens || 0;
            const reasoningTokens = json.usage?.reasoning_tokens || 0;

            if (textModel.pricing.per_token_input) {
                cost += inputTokens * (textModel.pricing.per_token_input / model.tokenDivisor);
            }
            if (textModel.pricing.per_token_output) {
                cost += outputTokens * (textModel.pricing.per_token_output / model.tokenDivisor);
            }
            if (textModel.pricing.per_token_reasoning && reasoningTokens > 0) {
                cost += reasoningTokens * (textModel.pricing.per_token_reasoning / model.tokenDivisor);
            }
            if (textModel.pricing.per_request) {
                cost += textModel.pricing.per_request;
            }
            return cost;
        }

        return 0;
    }

    // Helpers

    private async request(path: string, method: string, body: Record<string, any>): Promise<Response> {
        const res = await fetch(`${this.PERPLEXITY_BASE_URL}${path}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.LLM_PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`Perplexity API error: ${res.status} ${errorText}`);
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

        const body: Record<string, any> = {
            model: req.model,
            messages: [
                {
                    role: 'system',
                    content: req.system,
                },
                {
                    role: 'user',
                    content: `${req.prompt}${data ? `: \n\n${data}` : ''}`,
                }
            ],
            max_tokens: req.params?.maxTokens,
            temperature: req.params?.temperature,
            top_p: req.params?.topP,
            frequency_penalty: req.params?.frequencyPenalty,
            presence_penalty: req.params?.presencePenalty,
            stream: req.params?.stream
        };

        // Add Perplexity-specific parameters if provided
        if (req.params?.search_context_size) {
            body.web_search_options = {
                search_context_size: req.params.search_context_size
            };
        }

        if (req.params?.search_domain_filter) {
            body.search_domain_filter = req.params.search_domain_filter;
        }

        if (req.params?.search_recency_filter) {
            body.search_recency_filter = req.params.search_recency_filter;
        }

        if (req.params?.return_related_questions !== undefined) {
            body.return_related_questions = req.params.return_related_questions;
        }

        return body;
    }

}

interface TextModel {
    id: string;
    modelType: LlmModelType[];
    tokenDivisor: number;
    pricing: {
        per_token_input: number;
        per_token_output: number;
        per_token_reasoning?: number;
        per_request: number;
    };
}

// For more information on pricing, see https://docs.perplexity.ai/guides/pricing
const models = [
    {
        id: 'sonar',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            per_token_input: 1.0,
            per_token_output: 1.0,
            per_request: 0.005
        }
    },
    {
        id: 'sonar-pro',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            per_token_input: 3.0,
            per_token_output: 15.0,
            per_request: 0.005
        }
    },
    {
        id: 'sonar-deep-research',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            per_token_input: 2.0,
            per_token_reasoning: 3.0,
            per_token_output: 8.0,
            per_request: 0.005
        }
    },
    {
        id: 'sonar-reasoning',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            per_token_input: 1.0,
            per_token_output: 5.0,
            per_request: 0.005
        }
    },
    {
        id: 'sonar-reasoning-pro',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            per_token_input: 2.0,
            per_token_output: 8.0,
            per_request: 0.005
        }
    },
    {
        id: 'r1-1776',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            per_token_input: 2.0,
            per_token_output: 8.0
        }
    }
];
