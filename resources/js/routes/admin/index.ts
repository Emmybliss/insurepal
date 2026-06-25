import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
import tenants from './tenants'
import users from './users'
import policyTypes from './policy-types'
import policyCategories from './policy-categories'
import api from './api'
import policyClasses from './policy-classes'
import policies from './policies'
import roles from './roles'
import permissions from './permissions'
import userRoles from './user-roles'
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
const admin = {
    dashboard: Object.assign(dashboard, dashboard),
tenants: Object.assign(tenants, tenants),
users: Object.assign(users, users),
analytics: Object.assign(analytics, analytics),
settings: Object.assign(settings, settings),
policyTypes: Object.assign(policyTypes, policyTypes),
policyCategories: Object.assign(policyCategories, policyCategories),
api: Object.assign(api, api),
policyClasses: Object.assign(policyClasses, policyClasses),
policies: Object.assign(policies, policies),
roles: Object.assign(roles, roles),
permissions: Object.assign(permissions, permissions),
userRoles: Object.assign(userRoles, userRoles),
}

export default admin