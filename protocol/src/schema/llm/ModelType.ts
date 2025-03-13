import { Schema } from 'airtight';

export enum ModelType {
    TEXT = 'text',
    IMAGE = 'image',
}

export const ModelTypeSchema = new Schema<ModelType>({
    id: 'ModelType',
    type: 'string',
    enum: Object.values(ModelType),
});
