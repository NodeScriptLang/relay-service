import { TextModelParams } from '../schema/TextModelParams.js';

export class AnthropicService {

    formatTextRequestBody(params: Partial<TextModelParams>): Record<string, any> {
        return {
            'model': params.model,
            'messages': [
                {
                    role: 'user',
                    content: `${params.systemPrompt}\n\n${params.data}`
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
