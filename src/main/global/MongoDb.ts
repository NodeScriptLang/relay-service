import { statusCheck } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import assert from 'assert';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';
import { Db, MongoClient } from 'mongodb';

export class MongoDb {

    @config({ default: 'mongodb://localhost:27017/nodescriptRelay' })
    private MONGO_URL!: string;

    @dep() logger!: Logger;

    isRunning = false;
    client: MongoClient;

    constructor() {
        this.client = new MongoClient(this.MONGO_URL, {
            ignoreUndefined: true,
        });
    }

    get db(): Db {
        return this.client.db();
    }

    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        await this.client.connect();
        this.logger.info('Connected to MongoDB');
    }

    async stop() {
        try {
            await this.client.close();
            this.logger.info('MongoDB connection closed');
        } finally {
            this.isRunning = false;
        }
    }

    @statusCheck()
    async checkHealth() {
        if (!this.isRunning) {
            return 'skip';
        }
        const stats = await this.db.stats();
        assert.ok(stats.ok);
        return 'ok';
    }

}
