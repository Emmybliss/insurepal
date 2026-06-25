<?php

namespace App\Providers;

use App\Models\CommunicationMessage;
use App\Models\CommunicationThread;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Policy;
use App\Models\Quote;
use App\Policies\CommunicationMessagePolicy;
use App\Policies\CommunicationThreadPolicy;
use App\Policies\CustomerPolicy;
use App\Policies\ExpensePolicy;
use App\Policies\QuotePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Customer::class => CustomerPolicy::class,
        Expense::class => ExpensePolicy::class,
        Quote::class => QuotePolicy::class,
        CommunicationThread::class => CommunicationThreadPolicy::class,
        CommunicationMessage::class => CommunicationMessagePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Certificate Template Gates
        Gate::define('view_certificate_templates', function ($user) {
            return $user->hasPermissionTo('view_certificate_templates') ||
                   $user->hasPermissionTo('manage_certificate_templates');
        });

        Gate::define('create_certificate_templates', function ($user) {
            return $user->hasPermissionTo('create_certificate_templates') ||
                   $user->hasPermissionTo('manage_certificate_templates');
        });

        // Certificate Settings Gates
        Gate::define('manage_certificate_settings', function ($user) {
            return $user->hasPermissionTo('manage_certificate_settings');
        });

        // Certificate Generation Gates
        Gate::define('generate_certificates', function ($user, $policy = null) {
            $hasPermission = $user->hasPermissionTo('generate_certificates');

            if ($policy && $hasPermission) {
                // Ensure policy belongs to user's tenant
                return $policy->tenant_id === $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('view_certificates', function ($user) {
            return $user->hasPermissionTo('view_certificates') ||
                   $user->hasPermissionTo('view-certificates');
        });

        Gate::define('view_certificate', function ($user, $certificate) {
            $hasPermission = $user->hasPermissionTo('view_certificates') ||
                           $user->hasPermissionTo('view-certificate');

            if ($certificate && $hasPermission) {
                return $certificate->tenant_id === $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('download_certificate', function ($user, $certificate) {
            $hasPermission = $user->hasPermissionTo('download_certificates') ||
                           $user->hasPermissionTo('download-certificate');

            if ($certificate && $hasPermission) {
                return $certificate->tenant_id === $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('issue_certificate', function ($user, $certificate) {
            $hasPermission = $user->hasPermissionTo('issue_certificates') ||
                           $user->hasPermissionTo('issue-certificate');

            if ($certificate && $hasPermission) {
                return $certificate->tenant_id === $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('cancel_certificate', function ($user, $certificate) {
            $hasPermission = $user->hasPermissionTo('cancel_certificates') ||
                           $user->hasPermissionTo('cancel-certificate');

            if ($certificate && $hasPermission) {
                return $certificate->tenant_id === $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('regenerate_certificate', function ($user, $certificate) {
            $hasPermission = $user->hasPermissionTo('regenerate_certificates') ||
                           $user->hasPermissionTo('regenerate-certificate');

            if ($certificate && $hasPermission) {
                return $certificate->tenant_id === $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('bulk_generate_certificates', function ($user) {
            return $user->hasPermissionTo('bulk_generate_certificates') ||
                   $user->hasPermissionTo('bulk-generate-certificates');
        });

        // Financial Note Gates (Debit/Credit Notes)
        Gate::define('view_financial_notes', function ($user) {
            return $user->hasPermissionTo('view_financial_notes') || $user->hasPermissionTo('view-financial-notes');
        });

        Gate::define('generate_debit_notes', function ($user, $note = null) {
            $hasPermission = $user->hasPermissionTo('create_debit_notes') ||
                            $user->hasPermissionTo('create_financial_notes') ||
                            $user->hasPermissionTo('generate_debit_notes') ||
                            $user->hasPermissionTo('view_financial_notes') ||
                            $user->hasPermissionTo('generate_documents_from_templates');

            if ($note && $hasPermission) {
                return $note->tenant_id == $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('generate_credit_notes', function ($user, $note = null) {
            $hasPermission = $user->hasPermissionTo('create_credit_notes') ||
                            $user->hasPermissionTo('create_financial_notes') ||
                            $user->hasPermissionTo('generate_credit_notes') ||
                            $user->hasPermissionTo('view_financial_notes') ||
                            $user->hasPermissionTo('generate_documents_from_templates');

            if ($note && $hasPermission) {
                return $note->tenant_id == $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('regenerate_debit_notes', function ($user, $note = null) {
            return Gate::allows('generate_debit_notes', $note);
        });

        Gate::define('regenerate_credit_notes', function ($user, $note = null) {
            return Gate::allows('generate_credit_notes', $note);
        });

        Gate::define('download_debit_notes', function ($user, $note = null) {
            $hasPermission = $user->hasPermissionTo('view_financial_notes') || $user->hasPermissionTo('download_debit_notes');
            if ($note && $hasPermission) {
                return $note->tenant_id == $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('download_credit_notes', function ($user, $note = null) {
            $hasPermission = $user->hasPermissionTo('view_financial_notes') || $user->hasPermissionTo('download_credit_notes');
            if ($note && $hasPermission) {
                return $note->tenant_id == $user->tenant_id;
            }

            return $hasPermission;
        });

        Gate::define('view_debit_notes', function ($user, $note = null) {
            return Gate::allows('generate_debit_notes', $note) || Gate::allows('download_debit_notes', $note);
        });

        Gate::define('view_credit_notes', function ($user, $note = null) {
            return Gate::allows('generate_credit_notes', $note) || Gate::allows('download_credit_notes', $note);
        });

        Gate::define('mark_credit_notes_paid', function ($user, $note = null) {
            $hasPermission = $user->hasAnyPermission(['mark_financial_notes_paid', 'mark_credit_notes_paid']);
            if ($note && $hasPermission) {
                return $note->tenant_id == $user->tenant_id;
            }

            return $hasPermission;
        });

        // Tenant Relationship Gates
        Gate::define('view_tenant_relationships', function ($user) {
            $isCorrectTenantType = in_array($user->tenant?->type, ['underwriter', 'broker']);

            return $isCorrectTenantType ||
                   $user->hasAnyRole(['underwriter', 'broker', 'admin', 'super_admin']) ||
                   $user->hasPermissionTo('view_tenant_relationships');
        });

        Gate::define('create_tenant_relationships', function ($user) {
            $isCorrectTenantType = in_array($user->tenant?->type, ['underwriter', 'broker']);

            return $isCorrectTenantType ||
                   $user->hasAnyRole(['underwriter', 'broker', 'admin', 'super_admin']) ||
                   $user->hasPermissionTo('create_tenant_relationships');
        });

        Gate::define('accept_tenant_relationships', function ($user) {
            $isCorrectTenantType = in_array($user->tenant?->type, ['underwriter', 'broker']);

            return $isCorrectTenantType ||
                   $user->hasAnyRole(['underwriter', 'broker', 'admin', 'super_admin']) ||
                   $user->hasPermissionTo('accept_tenant_relationships');
        });

        Gate::define('decline_tenant_relationships', function ($user) {
            $isCorrectTenantType = in_array($user->tenant?->type, ['underwriter', 'broker']);

            return $isCorrectTenantType ||
                   $user->hasAnyRole(['underwriter', 'broker', 'admin', 'super_admin']) ||
                   $user->hasPermissionTo('decline_tenant_relationships');
        });

        Gate::define('remove_tenant_relationships', function ($user) {
            $isCorrectTenantType = in_array($user->tenant?->type, ['underwriter', 'broker']);

            return $isCorrectTenantType ||
                   $user->hasAnyRole(['underwriter', 'broker', 'admin', 'super_admin']) ||
                   $user->hasPermissionTo('remove_tenant_relationships');
        });

        Gate::before(function ($user, $ability) {
            if ($user->hasRole('super_admin')) {
                return true;
            }
            Log::info("Gate Check: {$ability} for User: {$user->id}");
        });
    }
}
