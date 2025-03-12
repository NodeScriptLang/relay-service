import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { config } from 'mesh-config';

import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse } from '../../schema/llm/LlmCompleteResponse.js';
import { TextModelParams } from '../../schema/llm/TextModelParams.js';
import { LlmService } from './LlmService.js';

export class AnthropicLlmService extends LlmService {

    @config({ default: 'https://api.anthropic.com/v1' }) ANTHROPIC_BASE_URL!: string;
    @config() LLM_ANTHROPIC_API_KEY!: string;

    async complete(llmReq: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        try {
            const url = this.getRequestUrl(llmReq.modelType);
            const body = this.getRequestBody(llmReq.modelType, llmReq.params);
            const bodyString = body ? JSON.stringify(body) : {};

            const req = FetchRequestSpecSchema.create({
                method: llmReq.method as FetchMethod,
                url,
                headers: {
                    ...llmReq.headers,
                    'X-Api-Key': this.LLM_ANTHROPIC_API_KEY,
                    'Content-Type': 'application/json',
                    'Anthropic-Version': '2023-06-01',
                    'Anthropic-Dangerous-Direct-Browser-Access': 'true'
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

    private getRequestUrl(modelType: string): string {
        if (modelType === 'text') {
            return `${this.ANTHROPIC_BASE_URL}/messages`;
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

    private formatTextRequestBody(params: Partial<TextModelParams>): Record<string, any> {
        const data = JSON.stringify(params.data);
        return {
            'model': params.model,
            'messages': [
                {
                    role: 'user',
                    content: `${params.userPrompt}${data ? `\n\n${data}` : ''}`
                },
            ],
            'max_tokens': params.maxTokens,
            'temperature': params.temperature,
            'top_p': params.topP,
            'top_k': params.topK,
            'stop_sequences': params.stopSequences,
            'stream': params.stream,
            'system': params.systemPrompt,
        };
    }

}
