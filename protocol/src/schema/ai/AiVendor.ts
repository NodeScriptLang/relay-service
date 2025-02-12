import { Schema } from 'airtight';

export enum AiVendor {
    ANTHROPIC = 'anthropic',
    GEMINI = 'gemini',
    OPENAI = 'openai',
}

export const AiVendorSchema = new Schema<AiVendor>({
    id: 'AiVendor',
    type: 'string',
    enum: Object.values(AiVendor),
});
