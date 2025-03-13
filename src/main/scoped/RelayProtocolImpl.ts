import { RelayProtocol } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { LlmDomainImpl } from './LlmDomainImpl.js';

export class RelayProtocolImpl implements RelayProtocol {

    @dep() Llm!: LlmDomainImpl;

}
