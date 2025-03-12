import { Schema } from 'airtight';

export interface TextModelParams {
    model: string;
    userPrompt: string;
    systemPrompt: string;
    data?: any;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    stopSequences?: string[];
    frequencyPenalty?: number;
    presencePenalty?: number;
    logitBias?: Record<number, number>;
    responseFormat?: 'json' | 'text' | 'xml';
    candidateCount?: number;
    seed?: number;
    stream?: boolean;
}

export const TextModelParamsSchema = new Schema<TextModelParams>({
    type: 'object',
    properties: {
        model: { type: 'string' },
        userPrompt: { type: 'string' },
        systemPrompt: { type: 'string' },
        data: {
            type: 'any', // Allow any valid JSON value (objects, arrays, primitives)
            optional: true,
        },
        maxTokens: {
            type: 'number',
            default: 1024,
            optional: true,
        },
        temperature: {
            type: 'number',
            default: 0.7,
            optional: true,
        },
        topP: {
            type: 'number',
            default: 1.0, // More standard than 0
            optional: true,
        },
        topK: {
            type: 'number',
            optional: true,
        },
        stopSequences: {
            type: 'array',
            items: { type: 'string' },
            optional: true,
        },
        frequencyPenalty: {
            type: 'number',
            optional: true,
        },
        presencePenalty: {
            type: 'number',
            optional: true,
        },
        logitBias: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'number' },
            optional: true,
        },
        responseFormat: {
            type: 'string',
            enum: ['json', 'text', 'xml'],
            optional: true,
        },
        candidateCount: {
            type: 'number',
            optional: true,
        },
        seed: { type: 'number', optional: true },
        stream: {
            type: 'boolean',
            optional: true,
        },
    },
});
