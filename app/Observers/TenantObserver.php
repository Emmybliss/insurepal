<?php

namespace App\Observers;

use App\Models\PolicyProduct;
use App\Models\Tenant;

class TenantObserver
{
    /**
     * Handle the Tenant "created" event.
     */
    public function created(Tenant $tenant): void
    {
        // Fetch all platform templates (where tenant_id is null)
        $templates = PolicyProduct::whereNull('tenant_id')->get();

        foreach ($templates as $template) {
            $newProduct = $template->replicate();
            $newProduct->tenant_id = $tenant->id;
            $newProduct->save();
        }
    }

    /**
     * Handle the Tenant "updated" event.
     */
    public function updated(Tenant $tenant): void
    {
        //
    }

    /**
     * Handle the Tenant "deleted" event.
     */
    public function deleted(Tenant $tenant): void
    {
        //
    }

    /**
     * Handle the Tenant "restored" event.
     */
    public function restored(Tenant $tenant): void
    {
        //
    }

    /**
     * Handle the Tenant "force deleted" event.
     */
    public function forceDeleted(Tenant $tenant): void
    {
        //
    }
}
