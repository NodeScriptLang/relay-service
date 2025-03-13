import { Schema } from 'airtight';

import { ImageModelParams } from './ImageModelParams.js';
import { TextModelParams } from './TextModelParams.js';

export interface LlmCompleteRequest {
    modelType: string;
    method: string;
    params: TextModelParams | ImageModelParams;
}

export const LlmCompleteRequestSchema = new Schema<LlmCompleteRequest>({
    type: 'object',
    properties: {
        modelType: { type: 'string' },
        method: { type: 'string' },
        params: { type: 'any' },
    },
});
