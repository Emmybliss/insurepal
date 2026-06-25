import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/admin/policy-classes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyClassController::index
 * @see app/Http/Controllers/PolicyClassController.php:16
 * @route '/admin/policy-classes'
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
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/admin/policy-classes/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyClassController::create
 * @see app/Http/Controllers/PolicyClassController.php:51
 * @route '/admin/policy-classes/create'
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
* @see \App\Http\Controllers\PolicyClassController::store
 * @see app/Http/Controllers/PolicyClassController.php:62
 * @route '/admin/policy-classes'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/admin/policy-classes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyClassController::store
 * @see app/Http/Controllers/PolicyClassController.php:62
 * @route '/admin/policy-classes'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::store
 * @see app/Http/Controllers/PolicyClassController.php:62
 * @route '/admin/policy-classes'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::store
 * @see app/Http/Controllers/PolicyClassController.php:62
 * @route '/admin/policy-classes'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::store
 * @see app/Http/Controllers/PolicyClassController.php:62
 * @route '/admin/policy-classes'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
export const show = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/admin/policy-classes/{policy_class}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
show.url = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_class: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_class: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_class: args.policy_class,
                }

    return show.definition.url
            .replace('{policy_class}', parsedArgs.policy_class.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
show.get = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
show.head = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
    const showForm = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
        showForm.get = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyClassController::show
 * @see app/Http/Controllers/PolicyClassController.php:70
 * @route '/admin/policy-classes/{policy_class}'
 */
        showForm.head = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
export const edit = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/admin/policy-classes/{policy_class}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
edit.url = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_class: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_class: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_class: args.policy_class,
                }

    return edit.definition.url
            .replace('{policy_class}', parsedArgs.policy_class.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
edit.get = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
edit.head = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
    const editForm = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
        editForm.get = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyClassController::edit
 * @see app/Http/Controllers/PolicyClassController.php:79
 * @route '/admin/policy-classes/{policy_class}/edit'
 */
        editForm.head = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    edit.form = editForm
/**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
export const update = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/admin/policy-classes/{policy_class}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
update.url = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_class: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_class: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_class: args.policy_class,
                }

    return update.definition.url
            .replace('{policy_class}', parsedArgs.policy_class.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
update.put = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
update.patch = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
    const updateForm = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
        updateForm.put = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\PolicyClassController::update
 * @see app/Http/Controllers/PolicyClassController.php:92
 * @route '/admin/policy-classes/{policy_class}'
 */
        updateForm.patch = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PATCH',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    update.form = updateForm
/**
* @see \App\Http\Controllers\PolicyClassController::destroy
 * @see app/Http/Controllers/PolicyClassController.php:100
 * @route '/admin/policy-classes/{policy_class}'
 */
export const destroy = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/admin/policy-classes/{policy_class}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PolicyClassController::destroy
 * @see app/Http/Controllers/PolicyClassController.php:100
 * @route '/admin/policy-classes/{policy_class}'
 */
destroy.url = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_class: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_class: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_class: args.policy_class,
                }

    return destroy.definition.url
            .replace('{policy_class}', parsedArgs.policy_class.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::destroy
 * @see app/Http/Controllers/PolicyClassController.php:100
 * @route '/admin/policy-classes/{policy_class}'
 */
destroy.delete = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::destroy
 * @see app/Http/Controllers/PolicyClassController.php:100
 * @route '/admin/policy-classes/{policy_class}'
 */
    const destroyForm = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::destroy
 * @see app/Http/Controllers/PolicyClassController.php:100
 * @route '/admin/policy-classes/{policy_class}'
 */
        destroyForm.delete = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: destroy.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'DELETE',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
    
    destroy.form = destroyForm
/**
* @see \App\Http\Controllers\PolicyClassController::toggleStatus
 * @see app/Http/Controllers/PolicyClassController.php:113
 * @route '/admin/policy-classes/{policy_class}/toggle-status'
 */
export const toggleStatus = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleStatus.url(args, options),
    method: 'post',
})

toggleStatus.definition = {
    methods: ["post"],
    url: '/admin/policy-classes/{policy_class}/toggle-status',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyClassController::toggleStatus
 * @see app/Http/Controllers/PolicyClassController.php:113
 * @route '/admin/policy-classes/{policy_class}/toggle-status'
 */
toggleStatus.url = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy_class: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy_class: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy_class: args.policy_class,
                }

    return toggleStatus.definition.url
            .replace('{policy_class}', parsedArgs.policy_class.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyClassController::toggleStatus
 * @see app/Http/Controllers/PolicyClassController.php:113
 * @route '/admin/policy-classes/{policy_class}/toggle-status'
 */
toggleStatus.post = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: toggleStatus.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyClassController::toggleStatus
 * @see app/Http/Controllers/PolicyClassController.php:113
 * @route '/admin/policy-classes/{policy_class}/toggle-status'
 */
    const toggleStatusForm = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: toggleStatus.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyClassController::toggleStatus
 * @see app/Http/Controllers/PolicyClassController.php:113
 * @route '/admin/policy-classes/{policy_class}/toggle-status'
 */
        toggleStatusForm.post = (args: { policy_class: string | number } | [policy_class: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: toggleStatus.url(args, options),
            method: 'post',
        })
    
    toggleStatus.form = toggleStatusForm
const policyClasses = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
toggleStatus: Object.assign(toggleStatus, toggleStatus),
}

export default policyClasses