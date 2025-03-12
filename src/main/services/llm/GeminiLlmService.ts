import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { config } from 'mesh-config';

import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse } from '../../schema/llm/LlmCompleteResponse.js';
import { TextModelParams } from '../../schema/llm/TextModelParams.js';
import { LlmService } from './LlmService.js';

export class GeminiLlmService extends LlmService {

    @config({ default: 'https://generativelanguage.googleapis.com/v1beta' }) GEMINI_BASE_URL!: string;
    @config() LLM_GEMINI_API_KEY!: string;

    async complete(llmReq: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        try {
            const url = this.getRequestUrl(llmReq.modelType, llmReq.params.model);
            const body = this.getRequestBody(llmReq.modelType, llmReq.params);
            const bodyString = body ? JSON.stringify(body) : {};

            const req = FetchRequestSpecSchema.create({
                method: llmReq.method as FetchMethod,
                url,
                headers: {
                    ...llmReq.headers,
                    'Content-Type': 'application/json',
                }
            });

            const res = await fetchUndici(req, bodyString);

            const responseHeaders = Object.fromEntries(
                Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
            );

            return {
                body: await res.body,
                status: res.status,
                headers: responseHeaders,
                url: req.url,
                method: req.method,
            };
        } catch (error) {
            return this.handleError(error);
        }
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
