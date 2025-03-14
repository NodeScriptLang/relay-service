import { Schema } from 'airtight';

import { LlmImageModelParams } from './LlmImageModelParams.js';
import { LlmTextModelParams } from './LlmTextModelParams.js';

export interface LlmCompleteRequest {
    modelType: string;
    method: string;
    params: LlmTextModelParams | LlmImageModelParams;
}

export const LlmCompleteRequestSchema = new Schema<LlmCompleteRequest>({
    type: 'object',
    properties: {
        modelType: { type: 'string' },
        method: { type: 'string' },
        params: { type: 'any' },
    },
});
