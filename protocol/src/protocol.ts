import { ProtocolIndex } from '@nodescript/protocomm';

import { LlmDomain } from './domains/LlmDomain.js';

export interface RelayProtocol {
    Llm: LlmDomain;
}

export const relayProtocol = new ProtocolIndex<RelayProtocol>({
    Llm: LlmDomain,
});
