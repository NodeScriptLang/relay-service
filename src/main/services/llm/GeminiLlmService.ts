import { TextModelParams } from '../../schema/llm/TextModelParams.js';

export class GeminiLlmService {

    formatTextRequestBody(params: Partial<TextModelParams>): Record<string, any> {
        return {
            'contents': [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `${params.systemPrompt}\n\n${params.userPrompt}${params.data ? `\n\n${params.data}` : ''}`
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
