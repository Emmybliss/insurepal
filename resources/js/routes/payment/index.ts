import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PaymentController::initialize
 * @see app/Http/Controllers/PaymentController.php:25
 * @route '/payment/initialize'
 */
export const initialize = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: initialize.url(options),
    method: 'post',
})

initialize.definition = {
    methods: ["post"],
    url: '/payment/initialize',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PaymentController::initialize
 * @see app/Http/Controllers/PaymentController.php:25
 * @route '/payment/initialize'
 */
initialize.url = (options?: RouteQueryOptions) => {
    return initialize.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PaymentController::initialize
 * @see app/Http/Controllers/PaymentController.php:25
 * @route '/payment/initialize'
 */
initialize.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: initialize.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PaymentController::initialize
 * @see app/Http/Controllers/PaymentController.php:25
 * @route '/payment/initialize'
 */
    const initializeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: initialize.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PaymentController::initialize
 * @see app/Http/Controllers/PaymentController.php:25
 * @route '/payment/initialize'
 */
        initializeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: initialize.url(options),
            method: 'post',
        })
    
    initialize.form = initializeForm
/**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
export const callback = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})

callback.definition = {
    methods: ["get","head"],
    url: '/payment/callback',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
callback.url = (options?: RouteQueryOptions) => {
    return callback.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
callback.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: callback.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
callback.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: callback.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
    const callbackForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: callback.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
        callbackForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PaymentController::callback
 * @see app/Http/Controllers/PaymentController.php:97
 * @route '/payment/callback'
 */
        callbackForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: callback.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    callback.form = callbackForm
/**
* @see \App\Http\Controllers\PaymentController::webhook
 * @see app/Http/Controllers/PaymentController.php:132
 * @route '/payment/webhook'
 */
export const webhook = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: webhook.url(options),
    method: 'post',
})

webhook.definition = {
    methods: ["post"],
    url: '/payment/webhook',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PaymentController::webhook
 * @see app/Http/Controllers/PaymentController.php:132
 * @route '/payment/webhook'
 */
webhook.url = (options?: RouteQueryOptions) => {
    return webhook.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PaymentController::webhook
 * @see app/Http/Controllers/PaymentController.php:132
 * @route '/payment/webhook'
 */
webhook.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: webhook.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PaymentController::webhook
 * @see app/Http/Controllers/PaymentController.php:132
 * @route '/payment/webhook'
 */
    const webhookForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: webhook.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PaymentController::webhook
 * @see app/Http/Controllers/PaymentController.php:132
 * @route '/payment/webhook'
 */
        webhookForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: webhook.url(options),
            method: 'post',
        })
    
    webhook.form = webhookForm
const payment = {
    initialize: Object.assign(initialize, initialize),
callback: Object.assign(callback, callback),
webhook: Object.assign(webhook, webhook),
}

export default payment