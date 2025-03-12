import { FetchHeaders } from '@nodescript/core/types';
import { config } from 'mesh-config';

import { TextModelParams } from '../../schema/llm/TextModelParams.js';
import { LlmService } from './LlmService.js';

export class AnthropicLlmService extends LlmService {

    @config({ default: 'https://api.anthropic.com/v1' }) ANTHROPIC_BASE_URL!: string;
    @config() LLM_ANTHROPIC_API_KEY!: string;

    protected getRequestUrl(modelType: string): string {
        if (modelType === 'text') {
            return `${this.ANTHROPIC_BASE_URL}/messages`;
        } else {
            throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    protected getRequestHeaders(headers: FetchHeaders): FetchHeaders {
        return {
            ...headers,
            'X-Api-Key': this.LLM_ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'Anthropic-Version': '2023-06-01',
            'Anthropic-Dangerous-Direct-Browser-Access': 'true'
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
            'model': params.model,
            'messages': [
                {
                    role: 'user',
                    content: `${params.userPrompt}${params.data ? `\n\n${params.data}` : ''}`
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
