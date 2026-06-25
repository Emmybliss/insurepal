import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/policies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyController::index
 * @see app/Http/Controllers/PolicyController.php:17
 * @route '/policies'
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
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/policies/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyController::create
 * @see app/Http/Controllers/PolicyController.php:61
 * @route '/policies/create'
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
* @see \App\Http\Controllers\PolicyController::store
 * @see app/Http/Controllers/PolicyController.php:74
 * @route '/policies'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/policies',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyController::store
 * @see app/Http/Controllers/PolicyController.php:74
 * @route '/policies'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::store
 * @see app/Http/Controllers/PolicyController.php:74
 * @route '/policies'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyController::store
 * @see app/Http/Controllers/PolicyController.php:74
 * @route '/policies'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyController::store
 * @see app/Http/Controllers/PolicyController.php:74
 * @route '/policies'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
export const show = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/policies/{policy}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
show.url = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { policy: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: typeof args.policy === 'object'
                ? args.policy.id
                : args.policy,
                }

    return show.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
show.get = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
show.head = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
    const showForm = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
        showForm.get = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyController::show
 * @see app/Http/Controllers/PolicyController.php:91
 * @route '/policies/{policy}'
 */
        showForm.head = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
export const edit = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/policies/{policy}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
edit.url = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { policy: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: typeof args.policy === 'object'
                ? args.policy.id
                : args.policy,
                }

    return edit.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
edit.get = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
edit.head = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
    const editForm = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
        editForm.get = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyController::edit
 * @see app/Http/Controllers/PolicyController.php:106
 * @route '/policies/{policy}/edit'
 */
        editForm.head = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
export const update = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/policies/{policy}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
update.url = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { policy: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: typeof args.policy === 'object'
                ? args.policy.id
                : args.policy,
                }

    return update.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
update.put = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
update.patch = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
    const updateForm = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
        updateForm.put = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\PolicyController::update
 * @see app/Http/Controllers/PolicyController.php:121
 * @route '/policies/{policy}'
 */
        updateForm.patch = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PolicyController::destroy
 * @see app/Http/Controllers/PolicyController.php:129
 * @route '/policies/{policy}'
 */
export const destroy = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/policies/{policy}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\PolicyController::destroy
 * @see app/Http/Controllers/PolicyController.php:129
 * @route '/policies/{policy}'
 */
destroy.url = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { policy: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: typeof args.policy === 'object'
                ? args.policy.id
                : args.policy,
                }

    return destroy.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::destroy
 * @see app/Http/Controllers/PolicyController.php:129
 * @route '/policies/{policy}'
 */
destroy.delete = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\PolicyController::destroy
 * @see app/Http/Controllers/PolicyController.php:129
 * @route '/policies/{policy}'
 */
    const destroyForm = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyController::destroy
 * @see app/Http/Controllers/PolicyController.php:129
 * @route '/policies/{policy}'
 */
        destroyForm.delete = (args: { policy: number | { id: number } } | [policy: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\PolicyController::renew
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/renew'
 */
export const renew = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renew.url(args, options),
    method: 'post',
})

renew.definition = {
    methods: ["post"],
    url: '/policies/{policy}/renew',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyController::renew
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/renew'
 */
renew.url = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: args.policy,
                }

    return renew.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::renew
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/renew'
 */
renew.post = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: renew.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyController::renew
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/renew'
 */
    const renewForm = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: renew.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyController::renew
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/renew'
 */
        renewForm.post = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: renew.url(args, options),
            method: 'post',
        })
    
    renew.form = renewForm
/**
* @see \App\Http\Controllers\PolicyController::cancel
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/cancel'
 */
export const cancel = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/policies/{policy}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\PolicyController::cancel
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/cancel'
 */
cancel.url = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: args.policy,
                }

    return cancel.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::cancel
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/cancel'
 */
cancel.post = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\PolicyController::cancel
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/cancel'
 */
    const cancelForm = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\PolicyController::cancel
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/cancel'
 */
        cancelForm.post = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, options),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
export const download = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/policies/{policy}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
download.url = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { policy: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    policy: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        policy: args.policy,
                }

    return download.definition.url
            .replace('{policy}', parsedArgs.policy.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
download.get = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
download.head = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
    const downloadForm = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: download.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
        downloadForm.get = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\PolicyController::download
 * @see app/Http/Controllers/PolicyController.php:0
 * @route '/policies/{policy}/download'
 */
        downloadForm.head = (args: { policy: string | number } | [policy: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    download.form = downloadForm
const policies = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
renew: Object.assign(renew, renew),
cancel: Object.assign(cancel, cancel),
download: Object.assign(download, download),
}

export default policies