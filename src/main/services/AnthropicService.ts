import { TextReqParameters } from '../schema/TextReqParameters.js';

export class AnthropicService {

    formatTextRequestBody(parameters: TextReqParameters): Record<string, any> {
        return {
            'model': parameters.model,
            'messages': [
                {
                    role: 'user',
                    content: parameters.userPrompt,
                },
            ],
            'max_tokens': parameters.maxTokens,
            'temperature': parameters.temperature,
            'top_p': parameters.topP,
            'top_k': parameters.topK,
            'stop_sequences': parameters.stopSequences,
            'stream': parameters.stream,
            'system': parameters.systemPrompt,
        };
    }

}
