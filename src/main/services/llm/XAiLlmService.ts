import { LlmCompleteResponse, LlmGenerateImage, LlmGenerateStructuredData, LlmGenerateText, LlmModelType } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class XAiLlmService extends LlmService {

    @config() LLM_XAI_API_KEY!: string;
    @config({ default: 'https://api.x.ai/v1/' }) XAI_BASE_URL!: string;
    @config({ default: 4096 }) DEFAULT_MAX_TOKENS!: number;

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

        let content = json.data[0].b64_json || json.data[0].url;
        if (content && content.startsWith('data:')) {
            content = content.split(',')[1];
        }

        return {
            content: content,
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
            const imageInputCount = json.usage.image_tokens || 0;

            let cost = 0;
            cost += promptTokens * (textModel.pricing.text_input / model.tokenDivisor);
            if (imageInputCount > 0 && textModel.pricing.image_input) {
                cost += imageInputCount * (textModel.pricing.image_input / model.tokenDivisor);
            }
            cost += completionTokens * (textModel.pricing.text_output / model.tokenDivisor);
            return cost;
        }

        if (model.modelType.includes(LlmModelType.IMAGE)) {
            const imageModel = model as ImageModel;
            const count = params.n || 1;
            return count * imageModel.pricing.image_output;
        }

        return 0;
    }

    // Helpers

    private async request(path: string, method: string, body: Record<string, any>): Promise<Response> {
        const res = await fetch(`${this.XAI_BASE_URL}${path}`, {
            method,
            headers: {
                'Authorization': `Bearer ${this.LLM_XAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`xAI API error: ${res.status} ${errorText}`);
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
            max_tokens: req.params?.maxTokens || this.DEFAULT_MAX_TOKENS,
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

    private formatImageRequestBody(req: LlmGenerateImage): Record<string, any> {
        return {
            model: req.model,
            prompt: req.prompt,
            n: req.params?.n || 1,
            response_format: req.params?.responseFormat || 'b64_json',
        };
    }

}

interface TextModel {
    id: string;
    modelType: LlmModelType[];
    tokenDivisor: number;
    pricing: {
        text_input: number;
        image_input?: number;
        text_output: number;
    };
}

interface ImageModel {
    id: string;
    modelType: LlmModelType[];
    tokenDivisor: number;
    pricing: {
        image_output: number;
    };
}

// For more details on pricing, see: https://docs.x.ai/docs/models?cluster=us-east-1
const models = [
    {
        id: 'grok-4',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 5.00,
            text_output: 15.00
        }
    },
    {
        id: 'grok-3',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 3.00,
            text_output: 12.00
        }
    },
    {
        id: 'grok-3-mini',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 1.00,
            text_output: 5.00
        }
    },
    {
        id: 'grok-2',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 2.00,
            text_output: 10.00
        }
    },
    {
        id: 'grok-2-vision',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 2.00,
            image_input: 2.00,
            text_output: 10.00
        }
    },
    {
        id: 'grok-vision-beta',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 5.00,
            image_input: 5.00,
            text_output: 15.00
        }
    },
    {
        id: 'grok-beta',
        modelType: [LlmModelType.TEXT],
        tokenDivisor: 1_000_000,
        pricing: {
            text_input: 5.00,
            text_output: 15.00
        }
    },
    {
        id: 'grok-2-image',
        modelType: [LlmModelType.IMAGE],
        tokenDivisor: 1,
        pricing: {
            image_output: 0.07
        }
    }
];
