import { AiTransaction } from '@nodescript/relay-protocol';

export interface AiUsageStats {
    count: number;
    totalTokens: number;
    cost?: number;
}

export abstract class AiStorage {

    abstract setup(): Promise<void>;

    abstract getAiTransaction(
        transactionId: string,
    ): Promise<AiTransaction | null>;

    abstract addUsage(
        transaction: AiTransaction,
    ): Promise<void>;

    abstract checkWorkspaceUsage(
        workspaceId: string,
    ): Promise<AiUsageStats>;

    abstract checkOrgUsage(
        orgId: string,
    ): Promise<AiUsageStats>;

}
