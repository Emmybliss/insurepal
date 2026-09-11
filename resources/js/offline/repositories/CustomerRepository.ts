import { idb, LocalCustomer, OutboxRecord } from '../database/idb';
import { v4 as uuidv4 } from 'uuid';

export class CustomerRepository {
    public static async createCustomer(tenantId: number, data: {
        first_name: string;
        last_name?: string;
        company_name?: string;
        email?: string;
        phone?: string;
        type?: 'individual' | 'corporate';
    }): Promise<LocalCustomer> {
        const clientUuid = uuidv4();
        const idempotencyKey = `idemp_cust_${clientUuid}`;
        const operationId = `op_cust_${clientUuid}`;
        const now = new Date().toISOString();

        const customer: LocalCustomer = {
            id: clientUuid,
            tenant_id: tenantId,
            first_name: data.first_name,
            last_name: data.last_name,
            company_name: data.company_name,
            email: data.email,
            phone: data.phone,
            type: data.type || 'individual',
            synced: false,
            created_at: now,
            updated_at: now,
        };

        const outboxItem: OutboxRecord = {
            id: operationId,
            idempotency_key: idempotencyKey,
            tenant_id: tenantId,
            entity_type: 'customer',
            entity_id: clientUuid,
            action: 'create',
            payload: {
                first_name: data.first_name,
                last_name: data.last_name,
                company_name: data.company_name,
                email: data.email,
                phone: data.phone,
                type: data.type || 'individual',
            },
            created_at: now,
            attempts: 0,
            status: 'pending',
        };

        await idb.saveCustomerWithOutbox(customer, outboxItem);
        return customer;
    }
}
