const Ziggy = {
    url: '',
    port: null,
    defaults: {},
    routes: {
        // General Routes
        'home': { uri: '/', methods: ['GET', 'HEAD'] },
        'dashboard': { uri: 'dashboard', methods: ['GET', 'HEAD'] },
        
        // Super Admin Routes
        'admin.dashboard': { uri: 'admin/dashboard', methods: ['GET', 'HEAD'] },
        'admin.analytics': { uri: 'admin/analytics', methods: ['GET', 'HEAD'] },
        'admin.tenants.index': { uri: 'admin/tenants', methods: ['GET', 'HEAD'] },
        'admin.tenants.show': { uri: 'admin/tenants/{tenant}', methods: ['GET', 'HEAD'] },
        'admin.tenants.suspend': { uri: 'admin/tenants/{tenant}/suspend', methods: ['POST'] },
        'admin.tenants.reactivate': { uri: 'admin/tenants/{tenant}/reactivate', methods: ['POST'] },
        'admin.users.index': { uri: 'admin/users', methods: ['GET', 'HEAD'] },
        'admin.users.show': { uri: 'admin/users/{user}', methods: ['GET', 'HEAD'] },
        'admin.users.activate': { uri: 'admin/users/{user}/activate', methods: ['POST'] },
        'admin.users.deactivate': { uri: 'admin/users/{user}/deactivate', methods: ['POST'] },
        'admin.settings': { uri: 'admin/settings', methods: ['GET', 'HEAD'] },
        'admin.reports.index': { uri: 'admin/reports', methods: ['GET', 'HEAD'] },

        // Admin Roles Management
        'admin.roles.index': { uri: 'admin/roles', methods: ['GET', 'HEAD'] },
        'admin.roles.create': { uri: 'admin/roles/create', methods: ['GET', 'HEAD'] },
        'admin.roles.store': { uri: 'admin/roles', methods: ['POST'] },
        'admin.roles.show': { uri: 'admin/roles/{role}', methods: ['GET', 'HEAD'] },
        'admin.roles.edit': { uri: 'admin/roles/{role}/edit', methods: ['GET', 'HEAD'] },
        'admin.roles.update': { uri: 'admin/roles/{role}', methods: ['PUT', 'PATCH'] },
        'admin.roles.destroy': { uri: 'admin/roles/{role}', methods: ['DELETE'] },

        // Admin Permissions Management
        'admin.permissions.index': { uri: 'admin/permissions', methods: ['GET', 'HEAD'] },
        'admin.permissions.create': { uri: 'admin/permissions/create', methods: ['GET', 'HEAD'] },
        'admin.permissions.store': { uri: 'admin/permissions', methods: ['POST'] },
        'admin.permissions.show': { uri: 'admin/permissions/{permission}', methods: ['GET', 'HEAD'] },
        'admin.permissions.edit': { uri: 'admin/permissions/{permission}/edit', methods: ['GET', 'HEAD'] },
        'admin.permissions.update': { uri: 'admin/permissions/{permission}', methods: ['PUT', 'PATCH'] },
        'admin.permissions.destroy': { uri: 'admin/permissions/{permission}', methods: ['DELETE'] },

        // Admin User Roles Management
        'admin.user-roles.index': { uri: 'admin/user-roles', methods: ['GET', 'HEAD'] },
        'admin.user-roles.show': { uri: 'admin/user-roles/{user}', methods: ['GET', 'HEAD'] },
        'admin.user-roles.edit': { uri: 'admin/user-roles/{user}/edit', methods: ['GET', 'HEAD'] },
        'admin.user-roles.update': { uri: 'admin/user-roles/{user}', methods: ['PUT', 'PATCH'] },
        'admin.user-roles.assign-role': { uri: 'admin/user-roles/{user}/assign-role', methods: ['POST'] },
        'admin.user-roles.remove-role': { uri: 'admin/user-roles/{user}/remove-role', methods: ['DELETE'] },
        'admin.user-roles.assign-permission': { uri: 'admin/user-roles/{user}/assign-permission', methods: ['POST'] },
        'admin.user-roles.remove-permission': { uri: 'admin/user-roles/{user}/remove-permission', methods: ['DELETE'] },

        // Admin Policy Management
        'admin.policy-types.index': { uri: 'admin/policy-types', methods: ['GET', 'HEAD'] },
        'admin.policy-types.create': { uri: 'admin/policy-types/create', methods: ['GET', 'HEAD'] },
        'admin.policy-types.store': { uri: 'admin/policy-types', methods: ['POST'] },
        'admin.policy-types.show': { uri: 'admin/policy-types/{policy_type}', methods: ['GET', 'HEAD'] },
        'admin.policy-types.edit': { uri: 'admin/policy-types/{policy_type}/edit', methods: ['GET', 'HEAD'] },
        'admin.policy-types.update': { uri: 'admin/policy-types/{policy_type}', methods: ['PUT', 'PATCH'] },
        'admin.policy-types.destroy': { uri: 'admin/policy-types/{policy_type}', methods: ['DELETE'] },
        'admin.policy-types.toggle-status': { uri: 'admin/policy-types/{policy_type}/toggle-status', methods: ['POST'] },

        'admin.policy-categories.index': { uri: 'admin/policy-categories', methods: ['GET', 'HEAD'] },
        'admin.policy-categories.create': { uri: 'admin/policy-categories/create', methods: ['GET', 'HEAD'] },
        'admin.policy-categories.store': { uri: 'admin/policy-categories', methods: ['POST'] },
        'admin.policy-categories.show': { uri: 'admin/policy-categories/{policy_category}', methods: ['GET', 'HEAD'] },
        'admin.policy-categories.edit': { uri: 'admin/policy-categories/{policy_category}/edit', methods: ['GET', 'HEAD'] },
        'admin.policy-categories.update': { uri: 'admin/policy-categories/{policy_category}', methods: ['PUT', 'PATCH'] },
        'admin.policy-categories.destroy': { uri: 'admin/policy-categories/{policy_category}', methods: ['DELETE'] },
        'admin.policy-categories.toggle-status': { uri: 'admin/policy-categories/{policy_category}/toggle-status', methods: ['POST'] },

        'admin.policy-classes.index': { uri: 'admin/policy-classes', methods: ['GET', 'HEAD'] },
        'admin.policy-classes.create': { uri: 'admin/policy-classes/create', methods: ['GET', 'HEAD'] },
        'admin.policy-classes.store': { uri: 'admin/policy-classes', methods: ['POST'] },
        'admin.policy-classes.show': { uri: 'admin/policy-classes/{policy_class}', methods: ['GET', 'HEAD'] },
        'admin.policy-classes.edit': { uri: 'admin/policy-classes/{policy_class}/edit', methods: ['GET', 'HEAD'] },
        'admin.policy-classes.update': { uri: 'admin/policy-classes/{policy_class}', methods: ['PUT', 'PATCH'] },
        'admin.policy-classes.destroy': { uri: 'admin/policy-classes/{policy_class}', methods: ['DELETE'] },
        'admin.policy-classes.toggle-status': { uri: 'admin/policy-classes/{policy_class}/toggle-status', methods: ['POST'] },

        'admin.policies.index': { uri: 'admin/policies', methods: ['GET', 'HEAD'] },
        'admin.policies.create': { uri: 'admin/policies/create', methods: ['GET', 'HEAD'] },
        'admin.policies.store': { uri: 'admin/policies', methods: ['POST'] },
        'admin.policies.show': { uri: 'admin/policies/{policy}', methods: ['GET', 'HEAD'] },
        'admin.policies.edit': { uri: 'admin/policies/{policy}/edit', methods: ['GET', 'HEAD'] },
        'admin.policies.update': { uri: 'admin/policies/{policy}', methods: ['PUT', 'PATCH'] },
        'admin.policies.destroy': { uri: 'admin/policies/{policy}', methods: ['DELETE'] },
        'admin.policies.toggle-status': { uri: 'admin/policies/{policy}/toggle-status', methods: ['POST'] },

        // API Routes
        'api.policy-types.categories': { uri: 'admin/api/policy-types/{policy_type}/categories', methods: ['GET', 'HEAD'] },
        'api.policy-categories.classes': { uri: 'admin/api/policy-categories/{policy_category}/classes', methods: ['GET', 'HEAD'] },
        'api.policies.calculate-premium': { uri: 'admin/api/policies/calculate-premium', methods: ['POST'] },
        'api.policy-classes.policies': { uri: 'admin/api/policy-classes/{policy_class}/policies', methods: ['GET', 'HEAD'] },

        // Customer Management
        'customers.index': { uri: 'customers', methods: ['GET', 'HEAD'] },
        'customers.create': { uri: 'customers/create', methods: ['GET', 'HEAD'] },
        'customers.store': { uri: 'customers', methods: ['POST'] },
        'customers.show': { uri: 'customers/{customer}', methods: ['GET', 'HEAD'] },
        'customers.edit': { uri: 'customers/{customer}/edit', methods: ['GET', 'HEAD'] },
        'customers.update': { uri: 'customers/{customer}', methods: ['PUT', 'PATCH'] },
        'customers.destroy': { uri: 'customers/{customer}', methods: ['DELETE'] },
        'customers.provision-access': { uri: 'customers/{customer}/provision-access', methods: ['POST'] },
        'customers.revoke-access': { uri: 'customers/{customer}/revoke-access', methods: ['DELETE'] },
        'customers.reset-password': { uri: 'customers/{customer}/reset-password', methods: ['POST'] },
        
        // Quotes Management
        'quotes.index': { uri: 'quotes', methods: ['GET', 'HEAD'] },
        'quotes.create': { uri: 'quotes/create', methods: ['GET', 'HEAD'] },
        'quotes.store': { uri: 'quotes', methods: ['POST'] },
        'quotes.show': { uri: 'quotes/{quote}', methods: ['GET', 'HEAD'] },
        'quotes.edit': { uri: 'quotes/{quote}/edit', methods: ['GET', 'HEAD'] },
        'quotes.update': { uri: 'quotes/{quote}', methods: ['PUT', 'PATCH'] },
        'quotes.destroy': { uri: 'quotes/{quote}', methods: ['DELETE'] },
        'quotes.send': { uri: 'quotes/{quote}/send', methods: ['POST'] },
        'quotes.accept': { uri: 'quotes/{quote}/accept', methods: ['POST'] },
        'quotes.reject': { uri: 'quotes/{quote}/reject', methods: ['POST'] },
        'quotes.convert-to-policy': { uri: 'quotes/{quote}/convert-to-policy', methods: ['POST'] },
        'quotes.duplicate': { uri: 'quotes/{quote}/duplicate', methods: ['POST'] },
        'quotes.extend-validity': { uri: 'quotes/{quote}/extend-validity', methods: ['POST'] },
        'quotes.export-pdf': { uri: 'quotes-export/pdf', methods: ['GET'] },
        'api.quotes.expiring-soon': { uri: 'api/quotes/expiring-soon', methods: ['GET'] },
        
        // Policies Management
        'policies.index': { uri: 'policies', methods: ['GET', 'HEAD'] },
        'policies.create': { uri: 'policies/create', methods: ['GET', 'HEAD'] },
        'policies.store': { uri: 'policies', methods: ['POST'] },
        'policies.show': { uri: 'policies/{policy}', methods: ['GET', 'HEAD'] },
        'policies.edit': { uri: 'policies/{policy}/edit', methods: ['GET', 'HEAD'] },
        'policies.update': { uri: 'policies/{policy}', methods: ['PUT', 'PATCH'] },
        'policies.destroy': { uri: 'policies/{policy}', methods: ['DELETE'] },
        'policies.renew': { uri: 'policies/{policy}/renew', methods: ['POST'] },
        'policies.pdf': { uri: 'policies/{policy}/pdf', methods: ['GET'] },
        
        // Financial Notes
        'financial-notes.index': { uri: 'financial-notes', methods: ['GET', 'HEAD'] },
        'financial-notes.create': { uri: 'financial-notes/create', methods: ['GET', 'HEAD'] },
        'financial-notes.store': { uri: 'financial-notes', methods: ['POST'] },
        'financial-notes.show': { uri: 'financial-notes/{note}', methods: ['GET', 'HEAD'] },
        'financial-notes.edit': { uri: 'financial-notes/{note}/edit', methods: ['GET', 'HEAD'] },
        'financial-notes.update': { uri: 'financial-notes/{note}', methods: ['PUT', 'PATCH'] },
        'financial-notes.destroy': { uri: 'financial-notes/{note}', methods: ['DELETE'] },
        'financial-notes.pdf': { uri: 'financial-notes/{note}/pdf', methods: ['GET'] },
        
        // Messaging
        'messages.index': { uri: 'messages', methods: ['GET', 'HEAD'] },
        'messages.create': { uri: 'messages/create', methods: ['GET', 'HEAD'] },
        'messages.store': { uri: 'messages', methods: ['POST'] },
        'messages.show': { uri: 'messages/{message}', methods: ['GET', 'HEAD'] },
        'messages.destroy': { uri: 'messages/{message}', methods: ['DELETE'] },
        
        // Reports
        'reports.index': { uri: 'reports', methods: ['GET', 'HEAD'] },
        'reports.naicom': { uri: 'reports/naicom', methods: ['GET', 'HEAD'] },
        'reports.financial': { uri: 'reports/financial', methods: ['GET', 'HEAD'] },
        'reports.customer': { uri: 'reports/customer', methods: ['GET', 'HEAD'] },
        'reports.export': { uri: 'reports/export', methods: ['POST'] },
        
        // Renewals
        'renewals.index': { uri: 'renewals', methods: ['GET', 'HEAD'] },
        'renewals.create': { uri: 'renewals/create', methods: ['GET', 'HEAD'] },
        'renewals.store': { uri: 'renewals', methods: ['POST'] },
        'renewals.show': { uri: 'renewals/{renewal}', methods: ['GET', 'HEAD'] },
        
        // Payment History
        'payments.history': { uri: 'payments/history', methods: ['GET', 'HEAD'] },
        'payments.show': { uri: 'payments/{payment}', methods: ['GET', 'HEAD'] },
        
        // Staff Management (for Underwriters/Brokers)
        'staff.index': { uri: 'staff', methods: ['GET', 'HEAD'] },
        'staff.create': { uri: 'staff/create', methods: ['GET', 'HEAD'] },
        'staff.store': { uri: 'staff', methods: ['POST'] },
        'staff.show': { uri: 'staff/{staff}', methods: ['GET', 'HEAD'] },
        'staff.edit': { uri: 'staff/{staff}/edit', methods: ['GET', 'HEAD'] },
        'staff.update': { uri: 'staff/{staff}', methods: ['PUT', 'PATCH'] },
        'staff.destroy': { uri: 'staff/{staff}', methods: ['DELETE'] },
        
        // Settings
        'settings.profile': { uri: 'settings/profile', methods: ['GET', 'HEAD'] },
        'settings.password': { uri: 'settings/password', methods: ['GET', 'HEAD'] },
        'settings.appearance': { uri: 'settings/appearance', methods: ['GET', 'HEAD'] },
        'settings.company': { uri: 'settings/company', methods: ['GET', 'HEAD'] },
        'settings.billing': { uri: 'settings/billing', methods: ['GET', 'HEAD'] },
        'settings.notifications': { uri: 'settings/notifications', methods: ['GET', 'HEAD'] },
        
        // Broker Management (for Underwriters)
        'brokers.index': { uri: 'brokers', methods: ['GET', 'HEAD'] },
        'brokers.create': { uri: 'brokers/create', methods: ['GET', 'HEAD'] },
        'brokers.store': { uri: 'brokers', methods: ['POST'] },
        'brokers.show': { uri: 'brokers/{broker}', methods: ['GET', 'HEAD'] },
        'brokers.edit': { uri: 'brokers/{broker}/edit', methods: ['GET', 'HEAD'] },
        'brokers.update': { uri: 'brokers/{broker}', methods: ['PUT', 'PATCH'] },
        
        // Auth Routes
        'login': { uri: 'login', methods: ['GET', 'HEAD'] },
        'logout': { uri: 'logout', methods: ['POST'] },
        'register': { uri: 'register', methods: ['GET', 'HEAD'] },
        'password.request': { uri: 'forgot-password', methods: ['GET', 'HEAD'] },
        'password.email': { uri: 'forgot-password', methods: ['POST'] },
        'password.reset': { uri: 'reset-password/{token}', methods: ['GET', 'HEAD'] },
        'password.update': { uri: 'reset-password', methods: ['POST'] },
        'verification.notice': { uri: 'verify-email', methods: ['GET', 'HEAD'] },
        'verification.verify': { uri: 'verify-email/{id}/{hash}', methods: ['GET', 'HEAD'] },
        'verification.send': { uri: 'email/verification-notification', methods: ['POST'] }
    }
};

if (typeof window !== 'undefined' && typeof window.Ziggy !== 'undefined') {
    Object.assign(Ziggy.routes, window.Ziggy.routes);
}

export { Ziggy };

// Route helper function
export function route(name, params, absolute, config = Ziggy) {
    const routeObj = config.routes[name];
    if (!routeObj) {
        console.warn(`Route [${name}] not found.`);
        return `/${name}`;
    }

    let uri = routeObj.uri;
    
    if (params) {
        if (typeof params === 'object') {
            Object.keys(params).forEach(key => {
                uri = uri.replace(`{${key}}`, params[key]);
            });
        } else {
            // Handle single parameter case
            uri = uri.replace(/\{[^}]+\}/, params);
        }
    }

    // Always return relative URLs with leading slash
    return `/${uri}`.replace(/\/+/g, '/');
}

// Make route function available globally
if (typeof window !== 'undefined') {
    window.route = route;
}