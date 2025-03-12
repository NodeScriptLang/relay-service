import { FetchRequestSpecSchema } from '@nodescript/core/schema';
import { FetchMethod } from '@nodescript/core/types';
import { fetchUndici } from '@nodescript/fetch-undici';
import { config } from 'mesh-config';

import { ImageModelParams } from '../../schema/llm/ImageModelParams.js';
import { LlmCompleteRequest } from '../../schema/llm/LlmCompleteRequest.js';
import { TextModelParams } from '../../schema/llm/TextModelParams.js';
import { LlmService } from './LlmService.js';

export class OpenaAiLlmService extends LlmService {

    @config({ default: 'https://api.openai.com/v1' }) OPENAI_BASE_URL!: string;
    @config() OPENAI_API_KEY!: string;

    async complete(req: LlmCompleteRequest): Promise<Record<string, any>> {
        const { modelType, method, headers, params } = req;

        try {
            let endpoint: string;
            let formattedBody: any;

            if (modelType === 'text') {
                endpoint = '/chat/completions';
                formattedBody = this.formatTextRequestBody(params);
            } else if (modelType === 'image') {
                endpoint = '/images/generations';
                formattedBody = this.formatImageRequestBody(params);
            } else {
                throw new Error(`Unsupported model type: ${modelType}`);
            }

            const req = FetchRequestSpecSchema.create({
                method: method as FetchMethod,
                url: `${this.OPENAI_BASE_URL}${endpoint}`,
                headers: {
                    ...headers,
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            });

            const bodyString = formattedBody ? JSON.stringify(formattedBody) : {};
            const res = await fetchUndici(req, bodyString);

            return {
                body: await res.body,
                status: res.status,
                headers: Object.fromEntries(
                    Object.entries(res.headers).map(([k, v]) => [k, Array.isArray(v) ? v : [v]])
                ),
                url: req.url,
                method: req.method,
            };
        } catch (error) {
            return this.handleError(error);
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
