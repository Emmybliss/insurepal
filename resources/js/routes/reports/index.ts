import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/reports',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportsController::index
 * @see app/Http/Controllers/ReportsController.php:16
 * @route '/reports'
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
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
export const naicom = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: naicom.url(options),
    method: 'get',
})

naicom.definition = {
    methods: ["get","head"],
    url: '/reports/naicom',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
naicom.url = (options?: RouteQueryOptions) => {
    return naicom.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
naicom.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: naicom.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
naicom.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: naicom.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
    const naicomForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: naicom.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
        naicomForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: naicom.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportsController::naicom
 * @see app/Http/Controllers/ReportsController.php:21
 * @route '/reports/naicom'
 */
        naicomForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: naicom.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    naicom.form = naicomForm
/**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
export const businessOverview = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessOverview.url(options),
    method: 'get',
})

businessOverview.definition = {
    methods: ["get","head"],
    url: '/reports/business-overview',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
businessOverview.url = (options?: RouteQueryOptions) => {
    return businessOverview.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
businessOverview.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: businessOverview.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
businessOverview.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: businessOverview.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
    const businessOverviewForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: businessOverview.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
        businessOverviewForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: businessOverview.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportsController::businessOverview
 * @see app/Http/Controllers/ReportsController.php:57
 * @route '/reports/business-overview'
 */
        businessOverviewForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: businessOverview.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    businessOverview.form = businessOverviewForm
/**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
export const customerAnalytics = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customerAnalytics.url(options),
    method: 'get',
})

customerAnalytics.definition = {
    methods: ["get","head"],
    url: '/reports/customer-analytics',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
customerAnalytics.url = (options?: RouteQueryOptions) => {
    return customerAnalytics.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
customerAnalytics.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: customerAnalytics.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
customerAnalytics.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: customerAnalytics.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
    const customerAnalyticsForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: customerAnalytics.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
        customerAnalyticsForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customerAnalytics.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportsController::customerAnalytics
 * @see app/Http/Controllers/ReportsController.php:96
 * @route '/reports/customer-analytics'
 */
        customerAnalyticsForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: customerAnalytics.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    customerAnalytics.form = customerAnalyticsForm
/**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
export const productPerformance = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productPerformance.url(options),
    method: 'get',
})

productPerformance.definition = {
    methods: ["get","head"],
    url: '/reports/product-performance',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
productPerformance.url = (options?: RouteQueryOptions) => {
    return productPerformance.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
productPerformance.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: productPerformance.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
productPerformance.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: productPerformance.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
    const productPerformanceForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: productPerformance.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
        productPerformanceForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productPerformance.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\ReportsController::productPerformance
 * @see app/Http/Controllers/ReportsController.php:139
 * @route '/reports/product-performance'
 */
        productPerformanceForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: productPerformance.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    productPerformance.form = productPerformanceForm
const reports = {
    index: Object.assign(index, index),
naicom: Object.assign(naicom, naicom),
businessOverview: Object.assign(businessOverview, businessOverview),
customerAnalytics: Object.assign(customerAnalytics, customerAnalytics),
productPerformance: Object.assign(productPerformance, productPerformance),
}

export default reports