import { Schema } from 'airtight';

export interface Cookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    size: number;
    httpOnly: boolean;
    secure: boolean;
    priority: string;
    sameParty: boolean;
    sourceScheme: string;
    sourcePort: number;
}

export const CookieSchema = new Schema<Cookie>({
    type: 'object',
    properties: {
        name: { type: 'string' },
        value: { type: 'string' },
        domain: { type: 'string' },
        path: { type: 'string' },
        expires: { type: 'number' },
        size: { type: 'number' },
        httpOnly: { type: 'boolean' },
        secure: { type: 'boolean' },
        priority: { type: 'string' },
        sameParty: { type: 'boolean' },
        sourceScheme: { type: 'string' },
        sourcePort: { type: 'number' },
    },
});
