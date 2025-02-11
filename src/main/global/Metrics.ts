import { HistogramMetric, metric } from '@nodescript/metrics';

export class Metrics {

    @metric()
    methodLatency = new HistogramMetric<{
        domain: string;
        method: string;
        error?: string;
    }>('nodescript_relay_service_latency', 'Relay service method latency');

}
