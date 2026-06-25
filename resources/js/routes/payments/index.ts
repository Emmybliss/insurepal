import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
export const history = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})

history.definition = {
    methods: ["get","head"],
    url: '/payments/history',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
history.url = (options?: RouteQueryOptions) => {
    return history.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
history.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: history.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
history.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: history.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
    const historyForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: history.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
        historyForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PaymentController::history
 * @see app/Http/Controllers/PaymentController.php:291
 * @route '/payments/history'
 */
        historyForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: history.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    history.form = historyForm
/**
* @see \App\Http\Controllers\PaymentController::cancelSubscription
 * @see app/Http/Controllers/PaymentController.php:308
 * @route '/payments/cancel-subscription'
 */
export const cancelSubscription = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelSubscription.url(options),
    method: 'post',
})

cancelSubscription.definition = {
    methods: ["post"],
    url: '/payments/cancel-subscription',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PaymentController::cancelSubscription
 * @see app/Http/Controllers/PaymentController.php:308
 * @route '/payments/cancel-subscription'
 */
cancelSubscription.url = (options?: RouteQueryOptions) => {
    return cancelSubscription.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PaymentController::cancelSubscription
 * @see app/Http/Controllers/PaymentController.php:308
 * @route '/payments/cancel-subscription'
 */
cancelSubscription.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancelSubscription.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PaymentController::cancelSubscription
 * @see app/Http/Controllers/PaymentController.php:308
 * @route '/payments/cancel-subscription'
 */
    const cancelSubscriptionForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancelSubscription.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PaymentController::cancelSubscription
 * @see app/Http/Controllers/PaymentController.php:308
 * @route '/payments/cancel-subscription'
 */
        cancelSubscriptionForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancelSubscription.url(options),
            method: 'post',
        })
    
    cancelSubscription.form = cancelSubscriptionForm
const payments = {
    history: Object.assign(history, history),
cancelSubscription: Object.assign(cancelSubscription, cancelSubscription),
}

export default payments