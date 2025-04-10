import { ProtocolIndex } from '@nodescript/protocomm';

import { LlmDomain } from './domains/LlmDomain.js';
import { WebAutomationDomain } from './domains/WebAutomationDomain.js';

export interface RelayProtocol {
    Llm: LlmDomain;
    WebAutomation: WebAutomationDomain;
}

export const relayProtocol = new ProtocolIndex<RelayProtocol>({
    Llm: LlmDomain,
    WebAutomation: WebAutomationDomain,
});
