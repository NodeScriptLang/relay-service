import { TextReqParameters } from '../schema/TextReqParameters.js';

export class OpenaAiService {

    formatTextRequestBody(parameters: TextReqParameters) {
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
            'stop': parameters.stopSequences,
            'frequency_penalty': parameters.frequencyPenalty,
            'presence_penalty': parameters.presencePenalty,
            'logit_bias': parameters.logitBias,
            'response_format': parameters.responseFormat,
            'seed': parameters.seed,
            'stream': parameters.stream
        };
    }

}
