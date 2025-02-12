import { HttpProtocolHandler } from '@nodescript/http-server';
import { RelayProtocol, relayProtocol } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { Metrics } from '../global/Metrics.js';
import { RelayProtocolImpl } from './RelayProtocolImpl.js';

export class RelayProtocolHandler extends HttpProtocolHandler<RelayProtocol> {

    @dep() protocolImpl!: RelayProtocolImpl;
    @dep() metrics!: Metrics;

    protocol = relayProtocol;

    constructor() {
        super();
        this.methodStats.on(stats => {
            this.metrics.methodLatency.addMillis(stats.latency, {
                domain: stats.domain,
                method: stats.method,
                error: stats.error,
            });
        });
    }

}
