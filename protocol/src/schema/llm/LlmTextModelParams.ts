import { Schema } from 'airtight';

export interface LlmTextModelParams {
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

    // Perplexity-specific parameters
    web_search?: boolean;
    search_context_size?: number;
    search_domain_filter?: string;
    search_recency_filter?: string;
    return_related_questions?: boolean;
}

export const LlmTextModelParamsSchema = new Schema<LlmTextModelParams>({
    type: 'object',
    properties: {
        data: {
            type: 'any',
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
            default: 1.0,
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
        // Perplexity-specific parameters
        web_search: {
            type: 'boolean',
            optional: true,
        },
        search_context_size: {
            type: 'number',
            optional: true,
        },
        search_domain_filter: {
            type: 'string',
            optional: true,
        },
        search_recency_filter: {
            type: 'string',
            optional: true,
        },
        return_related_questions: {
            type: 'boolean',
            optional: true,
        },
    },
});
