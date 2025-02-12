import { DomainDef } from '@nodescript/protocomm';

import { AiCommonInput, AiCommonInputSchema } from '../../schema/ai/AiCommonInput.js';
import { AiCommonOutput, AiCommonOutputSchema } from '../../schema/ai/AiCommonOutput.js';

export interface AiDomain {
    execute(req: {
        endpointUrl: string;
        endpointMethod: string;
        commonInputs: AiCommonInput;
        inputs?: Record<string, any>;
    }): Promise<{
        commonOutputs: AiCommonOutput;
        outputs?: Record<string, any>;
    }>;
}

export const AiDomain: DomainDef<AiDomain> = {
    name: 'Ai',
    methods: {
        execute: {
            type: 'query',
            params: {
                endpointUrl: { type: 'string' },
                endpointMethod: { type: 'string' },
                commonInputs: AiCommonInputSchema.schema,
                inputs: {
                    type: 'object',
                    properties: {},
                    additionalProperties: { type: 'any' },
                    optional: true,
                },
            },
            returns: {
                commonOutputs: AiCommonOutputSchema.schema,
                outputs: {
                    type: 'object',
                    properties: {},
                    additionalProperties: { type: 'any' },
                    optional: true,
                },
            },
        },

    },
    events: {},
};
