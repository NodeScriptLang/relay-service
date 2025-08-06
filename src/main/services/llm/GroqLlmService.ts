import { LlmCompleteResponse, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class GroqLlmService extends LlmService {

    @config() LLM_GROQ_API_KEY!: string;
    @config({ default: 'https://api.groq.com/openai/v1/' }) GROQ_BASE_URL!: string;

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

    async generateImage(): Promise<LlmCompleteResponse> {
        return {
            content: 'Image generation is not supported by Groq. Please select a different model.',
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

        if (model.modelType.includes(LlmModelType.TEXT)) {
            const textModel = model as TextModel;
            const inputTokens = json.usage.prompt_tokens;
            const outputTokens = json.usage.completion_tokens;

            const inputCost = inputTokens * (textModel.pricing.input_tokens / model.tokenDivisor);
            const outputCost = outputTokens * (textModel.pricing.output_tokens / model.tokenDivisor);

            return inputCost + outputCost;
        }

        return 0;
    }

    // Helpers

    private async request(path: string, method: string, body: Record<string, any>): Promise<Response> {
        const res = await fetch(`${this.GROQ_BASE_URL}${path}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.LLM_GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`Groq API error: ${res.status} ${errorText}`);
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
            max_completion_tokens: req.params?.maxTokens,
            temperature: req.params?.temperature,
            top_p: req.params?.topP,
            stop: req.params?.stopSequences,
            frequency_penalty: req.params?.frequencyPenalty,
            presence_penalty: req.params?.presencePenalty,
            response_format: req.params?.responseFormat,
            seed: req.params?.seed,
            stream: req.params?.stream
        };
    }

}

interface TextModel {
    id: string;
    modelType: LlmModelType[];
    tokenDivisor: number;
    pricing: {
        input_tokens: number;
        output_tokens: number;
    };
}

// For more details on pricing, see: https://groq.com/pricing/
const models = [
    {
        id: 'llama-4-scout',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 1.00,
            output_tokens: 1.50
        }
    },
    {
        id: 'llama-4-maverick',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 1.50,
            output_tokens: 2.00
        }
    },
    {
        id: 'llama-3.1-405b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 3.00,
            output_tokens: 3.00
        }
    },
    {
        id: 'llama-3.1-70b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.59,
            output_tokens: 0.79
        }
    },
    {
        id: 'llama-3.1-8b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.05,
            output_tokens: 0.08
        }
    },
    {
        id: 'kimi-k2',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 1.00,
            output_tokens: 1.50
        }
    },
    {
        id: 'deepseek-r1-distill-llama-70b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.75,
            output_tokens: 0.99
        }
    },
    {
        id: 'deepseek-r1-distill-qwen-32b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.69,
            output_tokens: 0.69
        }
    },
    {
        id: 'gemma2-9b-it',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.20,
            output_tokens: 0.20
        }
    },
    {
        id: 'llama-3.1-8b-instant',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.05,
            output_tokens: 0.08
        }
    },
    {
        id: 'llama-3.2-1b-preview',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.04,
            output_tokens: 0.04
        }
    },
    {
        id: 'llama-3.2-3b-preview',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.06,
            output_tokens: 0.06
        }
    },
    {
        id: 'llama-3.3-70b-specdec',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.59,
            output_tokens: 0.99
        }
    },
    {
        id: 'llama-3.3-70b-versatile',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.59,
            output_tokens: 0.79
        }
    },
    {
        id: 'llama3-70b-8192',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.59,
            output_tokens: 0.79
        }
    },
    {
        id: 'llama3-8b-8192',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.05,
            output_tokens: 0.08
        }
    },
    {
        id: 'mistral-saba-24b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.79,
            output_tokens: 0.79
        }
    },
    {
        id: 'qwen-2.5-32b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.79,
            output_tokens: 0.79
        }
    },
    {
        id: 'qwen-2.5-coder-32b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.79,
            output_tokens: 0.79
        }
    },
    {
        id: 'qwen-qwq-32b',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            input_tokens: 0.29,
            output_tokens: 0.39
        }
    }
];
