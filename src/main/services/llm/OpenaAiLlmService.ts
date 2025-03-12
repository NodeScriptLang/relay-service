import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { config } from 'mesh-config';

import { ImageModelParams } from '../../schema/llm/ImageModelParams.js';
import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';
import { LlmCompleteResponse } from '../../schema/llm/LlmCompleteResponse.js';
import { TextModelParams } from '../../schema/llm/TextModelParams.js';
import { LlmService } from './LlmService.js';

export class OpenaAiLlmService extends LlmService {

    @config({ default: 'https://api.openai.com/v1' }) OPENAI_BASE_URL!: string;
    @config() LLM_OPENAI_API_KEY!: string;

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
                    'Authorization': `Bearer ${this.LLM_OPENAI_API_KEY}`,
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

    private getRequestUrl(modelType: string): string {
        if (modelType === 'text') {
            return `${this.OPENAI_BASE_URL}/chat/completions`;
        } else if (modelType === 'image') {
            return `${this.OPENAI_BASE_URL}/images/generations`;
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    private getRequestBody(modelType: string, params: any): Record<string, any> {
        if (modelType === 'text') {
            return this.formatTextRequestBody(params);
        } else if (modelType === 'image') {
            return this.formatImageRequestBody(params);
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    private formatTextRequestBody(params: Partial<TextModelParams>): Record<string, any> {
        return {
            'model': params.model,
            'messages': [
                {
                    role: 'system',
                    content: params.systemPrompt,
                },
                {
                    role: 'user',
                    content: `${params.userPrompt}${params.data ? `\n\n${params.data}` : ''}`,
                },
            ],
            'max_tokens': params.maxTokens,
            'temperature': params.temperature,
            'top_p': params.topP,
            'stop': params.stopSequences,
            'frequency_penalty': params.frequencyPenalty,
            'presence_penalty': params.presencePenalty,
            'logit_bias': params.logitBias,
            'response_format': params.responseFormat,
            'seed': params.seed,
            'stream': params.stream
        };
    }

    private formatImageRequestBody(params: Partial<ImageModelParams>): Record<string, any> {
        return {
            'model': params.model,
            'prompt': params.userPrompt,
            'n': params.n,
            'size': params.size,
            'style': params.style,
            'user': params.user,
            'response_format': params.responseFormat,
        };
    }

}
