import { Logger } from '@nodescript/logger';
import { AiTransaction, AiVendor } from '@nodescript/relay-protocol';
import { dep } from 'mesh-ioc';

import { MongoDb } from '../MongoDb.js';
import { AiStorage, AiUsageStats } from './AiStorage.js';

interface MongoAiTransaction {
    _id: string;
    orgId: string;
    workspaceId: string;
    aiVendor: AiVendor;
    model: string;
    totalTokens: number;
    cost?: number;
    metadata?: Record<string, any>;
    createdAt: number;
}

export class MongoAiStorage extends AiStorage {

    @dep() private logger!: Logger;
    @dep() private mongodb!: MongoDb;

    private get collection() {
        return this.mongodb.db.collection<MongoAiTransaction>('aitransactions');
    }

    async setup(): Promise<void> {
        // For lookups
        await this.collection.createIndex({
            workspaceId: 1,
            key: 1,
        }, { unique: true });
        // For TTL expiration
        await this.collection.createIndex({
            expiresAt: 1,
        }, { expireAfterSeconds: 0 });
        this.logger.info('Created indexes on cachedata');
    }

    async getAiTransaction(transactionId: string): Promise<AiTransaction | null> {
        const doc = await this.collection.findOne({ _id: transactionId });
        if (!doc) {
            return null;
        }
        return this.deserialize(doc);
    }

    async addUsage(
        transaction: AiTransaction,
    ): Promise<void> {
        await this.collection.updateOne({
            ...transaction,
        }, {
            $setOnInsert: {
                createdAt: Date.now(),
            },
        }, { upsert: true });
    }

    async checkWorkspaceUsage(workspaceId: string): Promise<AiUsageStats> {
        const res = await this.collection.aggregate([
            {
                $match: { workspaceId }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalTokens: { $sum: '$totalTokens' },
                    cost: { $sum: '$cost' }
                }
            }
        ]).toArray();

        const doc = res[0] ?? { count: 0, totalTokens: 0, cost: 0 };
        return {
            count: doc.count,
            totalTokens: doc.totalTokens,
            cost: doc.cost
        };
    }

    async checkOrgUsage(orgId: string): Promise<AiUsageStats> {
        const res = await this.collection.aggregate([
            {
                $match: { orgId }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalTokens: { $sum: '$totalTokens' },
                    cost: { $sum: '$cost' }
                }
            }
        ]).toArray();

        const doc = res[0] ?? { count: 0, totalTokens: 0, cost: 0 };
        return {
            count: doc.count,
            totalTokens: doc.totalTokens,
            cost: doc.cost
        };
    }

    private deserialize(doc: MongoAiTransaction): AiTransaction {
        return {
            id: doc._id,
            ...doc,
            createdAt: doc.createdAt.valueOf(),
        };
    }

}
