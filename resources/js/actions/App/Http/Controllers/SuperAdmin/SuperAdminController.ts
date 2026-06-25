import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
export const dashboard = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})

dashboard.definition = {
    methods: ["get","head"],
    url: '/admin/dashboard',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
dashboard.url = (options?: RouteQueryOptions) => {
    return dashboard.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
dashboard.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: dashboard.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
dashboard.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: dashboard.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
    const dashboardForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: dashboard.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
        dashboardForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::dashboard
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:22
 * @route '/admin/dashboard'
 */
        dashboardForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: dashboard.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    dashboard.form = dashboardForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
export const tenants = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tenants.url(options),
    method: 'get',
})

tenants.definition = {
    methods: ["get","head"],
    url: '/admin/tenants',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
tenants.url = (options?: RouteQueryOptions) => {
    return tenants.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
tenants.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: tenants.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
tenants.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: tenants.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
    const tenantsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: tenants.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
        tenantsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tenants.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::tenants
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
        tenantsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: tenants.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    tenants.form = tenantsForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
export const showTenant = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showTenant.url(args, options),
    method: 'get',
})

showTenant.definition = {
    methods: ["get","head"],
    url: '/admin/tenants/{tenant}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
showTenant.url = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tenant: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tenant: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tenant: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tenant: typeof args.tenant === 'object'
                ? args.tenant.id
                : args.tenant,
                }

    return showTenant.definition.url
            .replace('{tenant}', parsedArgs.tenant.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
showTenant.get = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showTenant.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
showTenant.head = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showTenant.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
    const showTenantForm = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showTenant.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
        showTenantForm.get = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showTenant.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
        showTenantForm.head = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showTenant.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showTenant.form = showTenantForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspendTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
export const suspendTenant = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suspendTenant.url(args, options),
    method: 'post',
})

suspendTenant.definition = {
    methods: ["post"],
    url: '/admin/tenants/{tenant}/suspend',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspendTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
suspendTenant.url = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tenant: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tenant: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tenant: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tenant: typeof args.tenant === 'object'
                ? args.tenant.id
                : args.tenant,
                }

    return suspendTenant.definition.url
            .replace('{tenant}', parsedArgs.tenant.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspendTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
suspendTenant.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suspendTenant.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspendTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
    const suspendTenantForm = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: suspendTenant.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspendTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
        suspendTenantForm.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: suspendTenant.url(args, options),
            method: 'post',
        })
    
    suspendTenant.form = suspendTenantForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivateTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
export const reactivateTenant = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivateTenant.url(args, options),
    method: 'post',
})

reactivateTenant.definition = {
    methods: ["post"],
    url: '/admin/tenants/{tenant}/reactivate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivateTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
reactivateTenant.url = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { tenant: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { tenant: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    tenant: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        tenant: typeof args.tenant === 'object'
                ? args.tenant.id
                : args.tenant,
                }

    return reactivateTenant.definition.url
            .replace('{tenant}', parsedArgs.tenant.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivateTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
reactivateTenant.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivateTenant.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivateTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
    const reactivateTenantForm = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reactivateTenant.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivateTenant
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
        reactivateTenantForm.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reactivateTenant.url(args, options),
            method: 'post',
        })
    
    reactivateTenant.form = reactivateTenantForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
export const users = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: users.url(options),
    method: 'get',
})

users.definition = {
    methods: ["get","head"],
    url: '/admin/users',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
users.url = (options?: RouteQueryOptions) => {
    return users.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
users.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: users.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
users.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: users.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
    const usersForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: users.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
        usersForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: users.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::users
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:133
 * @route '/admin/users'
 */
        usersForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: users.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    users.form = usersForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
export const showUser = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showUser.url(args, options),
    method: 'get',
})

showUser.definition = {
    methods: ["get","head"],
    url: '/admin/users/{user}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
showUser.url = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { user: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { user: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    user: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        user: typeof args.user === 'object'
                ? args.user.id
                : args.user,
                }

    return showUser.definition.url
            .replace('{user}', parsedArgs.user.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
showUser.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showUser.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
showUser.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showUser.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
    const showUserForm = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showUser.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
        showUserForm.get = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showUser.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::showUser
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:176
 * @route '/admin/users/{user}'
 */
        showUserForm.head = (args: { user: number | { id: number } } | [user: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showUser.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showUser.form = showUserForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
export const analytics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: analytics.url(options),
    method: 'get',
})

analytics.definition = {
    methods: ["get","head"],
    url: '/admin/analytics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
analytics.url = (options?: RouteQueryOptions) => {
    return analytics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
analytics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: analytics.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
analytics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: analytics.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
    const analyticsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: analytics.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
        analyticsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: analytics.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::analytics
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:221
 * @route '/admin/analytics'
 */
        analyticsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: analytics.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    analytics.form = analyticsForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
export const settings = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: settings.url(options),
    method: 'get',
})

settings.definition = {
    methods: ["get","head"],
    url: '/admin/settings',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
settings.url = (options?: RouteQueryOptions) => {
    return settings.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
settings.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: settings.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
settings.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: settings.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
    const settingsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: settings.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
        settingsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: settings.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::settings
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:239
 * @route '/admin/settings'
 */
        settingsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: settings.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    settings.form = settingsForm
const SuperAdminController = { dashboard, tenants, showTenant, suspendTenant, reactivateTenant, users, showUser, analytics, settings }

export default SuperAdminController