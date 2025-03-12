import { ImageReqParameters } from '../schema/ImageParameters.js';
import { TextReqParameters } from '../schema/TextReqParameters.js';

export class OpenaAiService {

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
            'stop': params.stopSequences,
            'frequency_penalty': params.frequencyPenalty,
            'presence_penalty': params.presencePenalty,
            'logit_bias': params.logitBias,
            'response_format': params.responseFormat,
            'seed': params.seed,
            'stream': params.stream
        };
    }

    formatImageRequestBody(params: Partial<ImageReqParameters>): Record<string, any> {
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
