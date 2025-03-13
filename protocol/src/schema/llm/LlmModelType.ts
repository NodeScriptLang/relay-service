import { Schema } from 'airtight';

export enum LlmModelType {
    TEXT = 'text',
    IMAGE = 'image',
}

export const LlmModelTypeSchema = new Schema<LlmModelType>({
    id: 'LlmModelType',
    type: 'string',
    enum: Object.values(LlmModelType),
});
