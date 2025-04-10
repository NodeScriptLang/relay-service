import { Schema } from 'airtight';

export interface Cookie {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    size?: number;
    httpOnly?: boolean;
    secure?: boolean;
    priority?: string;
    sameParty?: boolean;
    sourceScheme?: string;
    sourcePort?: number;
}

export const CookieSchema = new Schema<Cookie>({
    type: 'object',
    properties: {
        name: { type: 'string' },
        value: { type: 'string' },
        domain: {
            type: 'string',
            optional: true,
        },
        path: {
            type: 'string',
            optional: true,
        },
        expires: {
            type: 'number',
            optional: true,
        },
        size: {
            type: 'number',
            optional: true,
        },
        httpOnly: {
            type: 'boolean',
            optional: true,
        },
        secure: {
            type: 'boolean',
            optional: true,
        },
        priority: {
            type: 'string',
            optional: true,
        },
        sameParty: {
            type: 'boolean',
            optional: true,
        },
        sourceScheme: {
            type: 'string',
            optional: true,
        },
        sourcePort: {
            type: 'number',
            optional: true,
        },
    },
});
