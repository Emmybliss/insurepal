import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/register/tenant',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::create
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:19
 * @route '/register/tenant'
 */
        createForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    create.form = createForm
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::store
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:24
 * @route '/register/tenant'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/register/tenant',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::store
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:24
 * @route '/register/tenant'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::store
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:24
 * @route '/register/tenant'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::store
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:24
 * @route '/register/tenant'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::store
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:24
 * @route '/register/tenant'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
export const showPlans = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showPlans.url(options),
    method: 'get',
})

showPlans.definition = {
    methods: ["get","head"],
    url: '/plans',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
showPlans.url = (options?: RouteQueryOptions) => {
    return showPlans.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
showPlans.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: showPlans.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
showPlans.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: showPlans.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
    const showPlansForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: showPlans.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
        showPlansForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showPlans.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\TenantRegistrationController::showPlans
 * @see app/Http/Controllers/Auth/TenantRegistrationController.php:54
 * @route '/plans'
 */
        showPlansForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: showPlans.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    showPlans.form = showPlansForm
const TenantRegistrationController = { create, store, showPlans }

export default TenantRegistrationController