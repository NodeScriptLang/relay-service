import { TextReqParameters } from '../schema/TextReqParameters.js';

export class GeminiService {

    formatTextRequestBody(parameters: TextReqParameters): Record<string, any> {
        return {
            'contents': [
                {
                    role: 'user',
                    parts: [
                        {
                            text: parameters.userPrompt
                        }
                    ]
                },
            ],
            'generationConfig': {
                'maxOutputTokens': parameters.maxTokens,
                'temperature': parameters.temperature,
                'top_p': parameters.topP,
                'top_k': parameters.topK,
                'stop_sequences': parameters.stopSequences,
                'stream': parameters.stream,
                'system_instruction': parameters.systemPrompt,
            }
        };
    }

}
