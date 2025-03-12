import { TextReqParameters } from '../schema/TextReqParameters.js';

export class AnthropicService {

    formatTextRequestBody(params: Partial<TextReqParameters>): Record<string, any> {
        return {
            'model': params.model,
            'messages': [
                {
                    role: 'user',
                    content: params.userPrompt,
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
