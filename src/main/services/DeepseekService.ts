import { TextReqParameters } from '../schema/TextReqParameters.js';

export class DeepseekService {

    formatTextRequestBody(parameters: TextReqParameters): Record<string, any> {
        return {
            'model': parameters.model,
            'messages': [
                {
                    role: 'system',
                    content: parameters.systemPrompt,
                },
                {
                    role: 'user',
                    content: parameters.userPrompt,
                },
            ],
            'max_tokens': parameters.maxTokens,
            'temperature': parameters.temperature,
            'top_p': parameters.topP,
            'top_k': parameters.topK,
            'stop': parameters.stopSequences,
            'stream': parameters.stream
        };
    }

}
