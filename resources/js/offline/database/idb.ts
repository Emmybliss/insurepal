/**
 * InsurePal Desktop Local IndexedDB Storage Service
 */

export interface OutboxRecord {
    id: string;              // Client UUIDv4 operation ID
    idempotency_key: string; // Unique idempotency hash
    tenant_id: number;       // Scope identifier
    user_id?: number;        // Initiating user ID
    entity_type: string;     // 'customer' | 'policy' | 'quote' | 'claim'
    entity_id: string;       // Client UUID of entity
    action: 'create' | 'update' | 'delete';
    payload: Record<string, any>;
    created_at: string;
    attempts: number;
    status: 'pending' | 'processing' | 'synced' | 'conflict' | 'failed';
    last_error?: string;
}

export interface LocalCustomer {
    id: string; // Client UUID or Server ID
    server_id?: number;
    tenant_id: number;
    first_name: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
    type: 'individual' | 'corporate';
    synced: boolean;
    created_at: string;
    updated_at: string;
}

const DB_NAME = 'insurepal_desktop_db';
const DB_VERSION = 1;

class InsurePalIDB {
    private db: IDBDatabase | null = null;

    public async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Outbox table
                if (!db.objectStoreNames.contains('sync_outbox')) {
                    const outboxStore = db.createObjectStore('sync_outbox', { keyPath: 'id' });
                    outboxStore.createIndex('status', 'status', { unique: false });
                    outboxStore.createIndex('idempotency_key', 'idempotency_key', { unique: true });
                }

                // Local Customers
                if (!db.objectStoreNames.contains('customers')) {
                    const custStore = db.createObjectStore('customers', { keyPath: 'id' });
                    custStore.createIndex('tenant_id', 'tenant_id', { unique: false });
                    custStore.createIndex('email', 'email', { unique: false });
                }

                // Local Policies
                if (!db.objectStoreNames.contains('policies')) {
                    const polStore = db.createObjectStore('policies', { keyPath: 'id' });
                    polStore.createIndex('tenant_id', 'tenant_id', { unique: false });
                }

                // Sync Meta (cursor, device_id, etc.)
                if (!db.objectStoreNames.contains('sync_meta')) {
                    db.createObjectStore('sync_meta', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event: Event) => {
                reject((event.target as IDBOpenDBRequest).error);
            };
        });
    }

    public async saveCustomerWithOutbox(customer: LocalCustomer, outboxItem: OutboxRecord): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(['customers', 'sync_outbox'], 'readwrite');
            const custStore = tx.objectStore('customers');
            const outboxStore = tx.objectStore('sync_outbox');

            custStore.put(customer);
            outboxStore.put(outboxItem);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async getPendingOutbox(): Promise<OutboxRecord[]> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sync_outbox', 'readonly');
            const store = tx.objectStore('sync_outbox');
            const index = store.index('status');
            const request = index.getAll('pending');

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    public async markOutboxSynced(id: string): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sync_outbox', 'readwrite');
            const store = tx.objectStore('sync_outbox');
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const record = getReq.result as OutboxRecord;
                if (record) {
                    record.status = 'synced';
                    store.put(record);
                }
                resolve();
            };
            getReq.onerror = () => reject(getReq.error);
        });
    }

    public async setMeta(key: string, value: any): Promise<void> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sync_meta', 'readwrite');
            tx.objectStore('sync_meta').put({ key, value });
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    public async getMeta(key: string): Promise<any> {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('sync_meta', 'readonly');
            const req = tx.objectStore('sync_meta').get(key);
            req.onsuccess = () => resolve(req.result?.value ?? null);
            req.onerror = () => reject(req.error);
        });
    }
}

export const idb = new InsurePalIDB();
