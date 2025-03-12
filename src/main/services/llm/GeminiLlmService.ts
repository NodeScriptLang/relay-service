import { FetchHeaders } from '@nodescript/core/types';
import { config } from 'mesh-config';

import { TextModelParams } from '../../schema/llm/TextModelParams.js';
import { LlmService } from './LlmService.js';

export class GeminiLlmService extends LlmService {

    @config({ default: 'https://generativelanguage.googleapis.com/v1beta' }) GEMINI_BASE_URL!: string;
    @config() LLM_GEMINI_API_KEY!: string;

    protected getRequestUrl(modelType: string, model: string): string {
        if (modelType === 'text') {
            const url = new URL(`${this.GEMINI_BASE_URL}/models/${model}:generateContent`);
            url.searchParams.append('key', this.LLM_GEMINI_API_KEY);
            return url.toString();
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getRequestHeaders(headers: FetchHeaders): FetchHeaders {
        return {
            ...headers,
            'Content-Type': 'application/json',
        };
    }

    protected getRequestBody(modelType: string, params: any): Record<string, any> {
        if (modelType === 'text') {
            return this.formatTextRequestBody(params);
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    formatTextRequestBody(params: Partial<TextModelParams>): Record<string, any> {
        return {
            'contents': [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${params.systemPrompt}\n\n${params.userPrompt}${params.data ? `\n\n${params.data}` : ''}`
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
