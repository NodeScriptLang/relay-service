import { RelayProtocol } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { LlmDomainImpl } from './LlmDomainImpl.js';
import { WebAutomationDomainImpl } from './WebAutomationDomainImpl.js';

export class RelayProtocolImpl implements RelayProtocol {

    @dep() Llm!: LlmDomainImpl;
    @dep() WebAutomation!: WebAutomationDomainImpl;

}
