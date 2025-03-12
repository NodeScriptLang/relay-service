import { TextReqParameters } from '../schema/TextReqParameters.js';

export class DeepseekService {

    formatTextRequestBody(params: Partial<TextReqParameters>): Record<string, any> {
        return {
            'model': params.model,
            'messages': [
                {
                    role: 'system',
                    content: params.systemPrompt,
                },
                {
                    role: 'user',
                    content: params.userPrompt,
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
