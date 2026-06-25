import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
export const register = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})

register.definition = {
    methods: ["get","head"],
    url: '/register-subscriber',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
register.url = (options?: RouteQueryOptions) => {
    return register.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
register.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: register.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
register.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: register.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
    const registerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: register.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
        registerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: register.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\Auth\SubscriberRegistrationController::register
 * @see app/Http/Controllers/Auth/SubscriberRegistrationController.php:27
 * @route '/register-subscriber'
 */
        registerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: register.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    register.form = registerForm
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
const subscriber = {
    register: Object.assign(register, register),
store: Object.assign(store, store),
}

export default subscriber