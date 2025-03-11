import { Schema } from 'airtight';

export interface ServiceProvider {
    id: string;
    title: string;
    baseUrl: string;
    authSchema: 'header' | 'query';
    useBearer: boolean;
    authParamName: string;
    authToken: string;
    headersAllowArray: boolean;
    metadata: Record<string, any>;
}

export const ServiceProviderSchema = new Schema<ServiceProvider>({
    type: 'object',
    properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        baseUrl: { type: 'string' },
        authSchema: {
            type: 'string',
            enum: ['header', 'query'],
        },
        useBearer: { type: 'boolean' },
        authParamName: { type: 'string' },
        authToken: { type: 'string' },
        headersAllowArray: { type: 'boolean' },
        metadata: {
            type: 'object',
            properties: {},
            additionalProperties: { type: 'any' },
        },
    },
});
