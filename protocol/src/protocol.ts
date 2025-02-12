import { ProtocolIndex } from '@nodescript/protocomm';

import { AiDomain } from './domains/ai/AiDomain.js';

export interface RelayProtocol {
    Ai: AiDomain;
}

export const relayProtocol = new ProtocolIndex<RelayProtocol>({
    Ai: AiDomain,
});
