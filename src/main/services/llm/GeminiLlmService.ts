import { LlmCompleteRequest, LlmCompleteResponse, TextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class GeminiLlmService extends LlmService {

    @config({ default: 'https://generativelanguage.googleapis.com/v1beta' }) GEMINI_BASE_URL!: string;
    @config() LLM_GEMINI_API_KEY!: string;

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

        return {
            body: json,
        };
    }

    private getRequestUrl(modelType: string, model: string): string {
        if (modelType === 'text') {
            const url = new URL(`${this.GEMINI_BASE_URL}/models/${model}:generateContent`);
            url.searchParams.append('key', this.LLM_GEMINI_API_KEY);
            return url.toString();
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    private getRequestBody(modelType: string, params: any): Record<string, any> {
        if (modelType === 'text') {
            return this.formatTextRequestBody(params);
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    formatTextRequestBody(params: Partial<TextModelParams>): Record<string, any> {
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
