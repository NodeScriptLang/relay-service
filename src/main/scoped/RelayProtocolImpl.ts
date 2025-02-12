import { RelayProtocol } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { AiDomainImpl } from './ai/AiDomainImpl.js';

export class RelayProtocolImpl implements RelayProtocol {

    @dep() Ai!: AiDomainImpl;

}
