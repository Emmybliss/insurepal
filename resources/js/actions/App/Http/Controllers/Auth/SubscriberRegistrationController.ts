import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/register-subscriber',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::create
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
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
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::store
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:35
 * @route '/register-subscriber'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/register-subscriber',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::store
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:35
 * @route '/register-subscriber'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::store
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:35
 * @route '/register-subscriber'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::store
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:35
 * @route '/register-subscriber'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::store
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:35
 * @route '/register-subscriber'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
const SubscriberRegistrationController = { create, store }

export default SubscriberRegistrationController