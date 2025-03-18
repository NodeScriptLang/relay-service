import { statusCheck } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { Redis } from 'ioredis';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class RedisManager {

    @config({ default: 'redis://localhost:6379/1' })
    private REDIS_URL!: string;

    @dep() private logger!: Logger;

    isRunning = false;
    client = this.createClient();

    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        await this.client.connect();
        this.logger.info('Redis connected');
    }

    async stop() {
        try {
            this.client.disconnect();
            this.logger.info('Redis disconnected');
        } finally {
            this.isRunning = false;
        }
    }

    @statusCheck()
    async checkHealth() {
        if (!this.isRunning) {
            return 'skip';
        }
        await this.client.ping();
        return 'ok';
    }

    createClient() {
        return new Redis(this.REDIS_URL, {
            lazyConnect: true,
            disconnectTimeout: 10,
        });
    }

}
