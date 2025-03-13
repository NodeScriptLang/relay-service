import { LlmCompleteRequest, LlmCompleteResponse, TextModelParams } from '@nodescript/relay-protocol';
import { config } from 'mesh-config';

import { LlmService } from './LlmService.js';

export class AnthropicLlmService extends LlmService {

    @config({ default: 'https://api.anthropic.com/v1' }) ANTHROPIC_BASE_URL!: string;
    @config() LLM_ANTHROPIC_API_KEY!: string;

    async complete(request: LlmCompleteRequest): Promise<LlmCompleteResponse> {
        const url = this.getRequestUrl(request.modelType);
        const body = this.getRequestBody(request.modelType, request.params);

        const res = await fetch(url, {
            method: request.method,
            headers: {
                'X-Api-Key': this.LLM_ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'Anthropic-Version': '2023-06-01',
                'Anthropic-Dangerous-Direct-Browser-Access': 'true'
            },
            body: body ? JSON.stringify(body) : undefined
        });
        if (!res.ok) {
            const errorText = await res.text();
            const error = new Error(`Anthropic API error: ${res.status} ${errorText}`);
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
