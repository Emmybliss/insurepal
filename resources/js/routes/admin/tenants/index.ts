import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/tenants',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::index
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:47
 * @route '/admin/tenants'
 */
        indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    index.form = indexForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
export const show = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/tenants/{tenant}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
show.url = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{tenant}', parsedArgs.tenant.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
show.get = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
show.head = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
    const showForm = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
        showForm.get = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::show
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:87
 * @route '/admin/tenants/{tenant}'
 */
        showForm.head = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    show.form = showForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspend
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
export const suspend = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suspend.url(args, options),
    method: 'post',
})

suspend.definition = {
    methods: ["post"],
    url: '/admin/tenants/{tenant}/suspend',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspend
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
suspend.url = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return suspend.definition.url
            .replace('{tenant}', parsedArgs.tenant.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspend
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
suspend.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: suspend.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspend
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
    const suspendForm = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: suspend.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::suspend
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:109
 * @route '/admin/tenants/{tenant}/suspend'
 */
        suspendForm.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: suspend.url(args, options),
            method: 'post',
        })
    
    suspend.form = suspendForm
/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivate
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
export const reactivate = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivate.url(args, options),
    method: 'post',
})

reactivate.definition = {
    methods: ["post"],
    url: '/admin/tenants/{tenant}/reactivate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivate
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
reactivate.url = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
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

    return reactivate.definition.url
            .replace('{tenant}', parsedArgs.tenant.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivate
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
reactivate.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reactivate.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivate
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
    const reactivateForm = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reactivate.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\SuperAdmin\SuperAdminController::reactivate
 * @see app/Http/Controllers/SuperAdmin/SuperAdminController.php:123
 * @route '/admin/tenants/{tenant}/reactivate'
 */
        reactivateForm.post = (args: { tenant: number | { id: number } } | [tenant: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reactivate.url(args, options),
            method: 'post',
        })
    
    reactivate.form = reactivateForm
const tenants = {
    index: Object.assign(index, index),
show: Object.assign(show, show),
suspend: Object.assign(suspend, suspend),
reactivate: Object.assign(reactivate, reactivate),
}

export default tenants