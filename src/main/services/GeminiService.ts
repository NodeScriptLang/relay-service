import { TextReqParameters } from '../schema/TextReqParameters.js';

export class GeminiService {

    formatTextRequestBody(params: Partial<TextReqParameters>): Record<string, any> {
        return {
            'contents': [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${params.systemPrompt}\n\n${params.userPrompt}`
                        }
                    ]
                },
            ],
            'generationConfig': {
                'maxOutputTokens': params.maxTokens,
                'temperature': params.temperature,
                'top_p': params.topP,
                'top_k': params.topK,
                'stop_sequences': params.stopSequences,
            }
        };
    }

}
