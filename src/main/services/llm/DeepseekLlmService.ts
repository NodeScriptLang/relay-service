import { LlmCompleteRequest, LlmCompleteResponse, TextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class DeepseekLlmService extends LlmService {

    @config({ default: 'https://api.deepseek.com/v1' }) DEEPSEEK_BASE_URL!: string;
    @config() LLM_DEEPSEEK_API_KEY!: string;

    async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        const url = this.getRequestUrl(request.modelType);
        const body = this.getRequestBody(request.modelType, request.params);

        const res = await fetch(url, {
            method: request.method,
            headers: {
                'Authorization': `Bearer ${this.LLM_DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`DeepSeek API error: ${res.status} ${errorText}`);
            (error as any).status = res.status;
            throw error;
        }
        const json = await res.json();

        return {
            body: json,
        };
    }

    private getRequestUrl(modelType: string): string {
        if (modelType === 'text') {
            return `${this.DEEPSEEK_BASE_URL}/chat/completions`;
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
            'model': params.model,
            'messages': [
                {
                    role: 'system',
                    content: params.systemPrompt,
                },
                {
                    role: 'user',
                    content: `${params.userPrompt}${data ? `\n\n${data}` : ''}`
                },
            ],
            'max_tokens': params.maxTokens,
            'temperature': params.temperature,
            'top_p': params.topP,
            'top_k': params.topK,
            'stop': params.stopSequences,
            'stream': params.stream
        };
    }

}
