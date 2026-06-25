import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
export const expiringSoon = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expiringSoon.url(options),
    method: 'get',
})

expiringSoon.definition = {
    methods: ["get","head"],
    url: '/api/quotes/expiring-soon',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
expiringSoon.url = (options?: RouteQueryOptions) => {
    return expiringSoon.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
expiringSoon.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: expiringSoon.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
expiringSoon.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: expiringSoon.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
    const expiringSoonForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: expiringSoon.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
        expiringSoonForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: expiringSoon.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuoteController::expiringSoon
 * @see app/Http/Controllers/QuoteController.php:314
 * @route '/api/quotes/expiring-soon'
 */
        expiringSoonForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: expiringSoon.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    expiringSoon.form = expiringSoonForm
const quotes = {
    expiringSoon: Object.assign(expiringSoon, expiringSoon),
}

export default quotes