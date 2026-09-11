import { idb } from '../database/idb';
import { SecureStorage } from './SecureStorage';

export class TenantIsolationManager {
    /**
     * Purge local tenant database and vault credentials when user logs out.
     */
    public static async purgeTenantSession(tenantId: number): Promise<void> {
        console.info(`[TenantIsolation] Purging session data for tenant: ${tenantId}`);

        // Purge stored credentials
        SecureStorage.removeToken('sanctum_token');
        SecureStorage.removeToken('active_tenant_id');

        // Clear local sync metadata
        await idb.setMeta('last_sync_cursor', 0);
        await idb.setMeta('active_tenant_id', null);

        console.info(`[TenantIsolation] Session purge complete for tenant: ${tenantId}`);
    }

    /**
     * Set active tenant and verify database boundary.
     */
    public static async setActiveTenant(tenantId: number): Promise<void> {
        const currentTenant = await idb.getMeta('active_tenant_id');

        if (currentTenant && currentTenant !== tenantId) {
            console.warn(`[TenantIsolation] Tenant switch detected (${currentTenant} -> ${tenantId}). Executing safety purge.`);
            await this.purgeTenantSession(currentTenant);
        }

        await idb.setMeta('active_tenant_id', tenantId);
        await SecureStorage.storeToken('active_tenant_id', String(tenantId));
    }
}
