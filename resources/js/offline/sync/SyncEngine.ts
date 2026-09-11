import { idb } from '../database/idb';

export type SyncState = 'online' | 'offline' | 'syncing' | 'synced' | 'error';

export class SyncEngine {
    private static instance: SyncEngine;
    private state: SyncState = 'online';
    private lastSyncTime: string | null = null;
    private listeners: Array<(state: SyncState, details: any) => void> = [];
    private syncInterval: number | null = null;

    private constructor() {
        this.initNetworkListeners();
    }

    public static getInstance(): SyncEngine {
        if (!SyncEngine.instance) {
            SyncEngine.instance = new SyncEngine();
        }
        return SyncEngine.instance;
    }

    public subscribe(listener: (state: SyncState, details: any) => void): () => void {
        this.listeners.push(listener);
        listener(this.state, { lastSyncTime: this.lastSyncTime });
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(details: any = {}): void {
        for (const listener of this.listeners) {
            listener(this.state, { ...details, lastSyncTime: this.lastSyncTime });
        }
    }

    private initNetworkListeners(): void {
        window.addEventListener('online', () => this.triggerSync());
        window.addEventListener('offline', () => {
            this.state = 'offline';
            this.notify();
        });
    }

    public startPeriodicSync(intervalMs = 30000): void {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = window.setInterval(() => this.triggerSync(), intervalMs);
    }

    public async triggerSync(): Promise<void> {
        if (!navigator.onLine) {
            this.state = 'offline';
            this.notify();
            return;
        }

        try {
            this.state = 'syncing';
            this.notify();

            // 1. Health check
            const healthRes = await fetch('/api/v1/sync/health', {
                headers: { 'Accept': 'application/json' },
            });

            if (!healthRes.ok) {
                this.state = 'offline';
                this.notify({ error: 'Server unreachable' });
                return;
            }

            // 2. Fetch pending outbox records
            const pendingOps = await idb.getPendingOutbox();
            const lastCursor = (await idb.getMeta('last_sync_cursor')) || 0;
            const deviceId = (await idb.getMeta('device_id')) || 'desktop_client_001';

            const syncPayload = {
                device_id: deviceId,
                device_name: 'InsurePal Desktop Client',
                platform: 'desktop',
                last_sync_cursor: lastCursor,
                outbox_operations: pendingOps.map(op => ({
                    operation_id: op.id,
                    idempotency_key: op.idempotency_key,
                    entity_type: op.entity_type,
                    entity_id: op.entity_id,
                    action: op.action,
                    payload: op.payload,
                })),
            };

            // 3. Post sync payload
            const response = await fetch('/api/v1/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(syncPayload),
            });

            if (!response.ok) {
                this.state = 'error';
                this.notify({ error: 'Sync endpoint returned error status' });
                return;
            }

            const data = await response.json();

            // Mark accepted outbox operations as synced
            if (data.accepted_operations && Array.isArray(data.accepted_operations)) {
                for (const accepted of data.accepted_operations) {
                    await idb.markOutboxSynced(accepted.operation_id);
                }
            }

            if (data.next_cursor) {
                await idb.setMeta('last_sync_cursor', data.next_cursor);
            }

            this.lastSyncTime = new Date().toLocaleTimeString();
            this.state = 'synced';
            this.notify({ acceptedCount: data.accepted_operations?.length || 0 });
        } catch (err: any) {
            this.state = 'error';
            this.notify({ error: err.message || 'Sync failed' });
        }
    }
}

export const syncEngine = SyncEngine.getInstance();
