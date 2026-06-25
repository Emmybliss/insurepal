import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/quotes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuoteController::index
 * @see app/Http/Controllers/QuoteController.php:25
 * @route '/quotes'
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
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/quotes/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuoteController::create
 * @see app/Http/Controllers/QuoteController.php:61
 * @route '/quotes/create'
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
* @see \App\Http\Controllers\QuoteController::store
 * @see app/Http/Controllers/QuoteController.php:92
 * @route '/quotes'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/quotes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::store
 * @see app/Http/Controllers/QuoteController.php:92
 * @route '/quotes'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::store
 * @see app/Http/Controllers/QuoteController.php:92
 * @route '/quotes'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::store
 * @see app/Http/Controllers/QuoteController.php:92
 * @route '/quotes'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::store
 * @see app/Http/Controllers/QuoteController.php:92
 * @route '/quotes'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
export const show = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/quotes/{quote}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
show.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return show.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
show.get = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
show.head = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
    const showForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
        showForm.get = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuoteController::show
 * @see app/Http/Controllers/QuoteController.php:109
 * @route '/quotes/{quote}'
 */
        showForm.head = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
export const edit = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/quotes/{quote}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
edit.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return edit.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
edit.get = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
edit.head = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
    const editForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
        editForm.get = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuoteController::edit
 * @see app/Http/Controllers/QuoteController.php:131
 * @route '/quotes/{quote}/edit'
 */
        editForm.head = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
export const update = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/quotes/{quote}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
update.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return update.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
update.put = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
update.patch = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
    const updateForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
        updateForm.put = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\QuoteController::update
 * @see app/Http/Controllers/QuoteController.php:162
 * @route '/quotes/{quote}'
 */
        updateForm.patch = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\QuoteController::destroy
 * @see app/Http/Controllers/QuoteController.php:179
 * @route '/quotes/{quote}'
 */
export const destroy = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/quotes/{quote}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\QuoteController::destroy
 * @see app/Http/Controllers/QuoteController.php:179
 * @route '/quotes/{quote}'
 */
destroy.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return destroy.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::destroy
 * @see app/Http/Controllers/QuoteController.php:179
 * @route '/quotes/{quote}'
 */
destroy.delete = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\QuoteController::destroy
 * @see app/Http/Controllers/QuoteController.php:179
 * @route '/quotes/{quote}'
 */
    const destroyForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::destroy
 * @see app/Http/Controllers/QuoteController.php:179
 * @route '/quotes/{quote}'
 */
        destroyForm.delete = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\QuoteController::send
 * @see app/Http/Controllers/QuoteController.php:194
 * @route '/quotes/{quote}/send'
 */
export const send = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(args, options),
    method: 'post',
})

send.definition = {
    methods: ["post"],
    url: '/quotes/{quote}/send',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::send
 * @see app/Http/Controllers/QuoteController.php:194
 * @route '/quotes/{quote}/send'
 */
send.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return send.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::send
 * @see app/Http/Controllers/QuoteController.php:194
 * @route '/quotes/{quote}/send'
 */
send.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: send.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::send
 * @see app/Http/Controllers/QuoteController.php:194
 * @route '/quotes/{quote}/send'
 */
    const sendForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: send.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::send
 * @see app/Http/Controllers/QuoteController.php:194
 * @route '/quotes/{quote}/send'
 */
        sendForm.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: send.url(args, options),
            method: 'post',
        })
    
    send.form = sendForm
/**
* @see \App\Http\Controllers\QuoteController::accept
 * @see app/Http/Controllers/QuoteController.php:210
 * @route '/quotes/{quote}/accept'
 */
export const accept = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: accept.url(args, options),
    method: 'post',
})

accept.definition = {
    methods: ["post"],
    url: '/quotes/{quote}/accept',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::accept
 * @see app/Http/Controllers/QuoteController.php:210
 * @route '/quotes/{quote}/accept'
 */
accept.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return accept.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::accept
 * @see app/Http/Controllers/QuoteController.php:210
 * @route '/quotes/{quote}/accept'
 */
accept.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: accept.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::accept
 * @see app/Http/Controllers/QuoteController.php:210
 * @route '/quotes/{quote}/accept'
 */
    const acceptForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: accept.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::accept
 * @see app/Http/Controllers/QuoteController.php:210
 * @route '/quotes/{quote}/accept'
 */
        acceptForm.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: accept.url(args, options),
            method: 'post',
        })
    
    accept.form = acceptForm
/**
* @see \App\Http\Controllers\QuoteController::reject
 * @see app/Http/Controllers/QuoteController.php:230
 * @route '/quotes/{quote}/reject'
 */
export const reject = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

reject.definition = {
    methods: ["post"],
    url: '/quotes/{quote}/reject',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::reject
 * @see app/Http/Controllers/QuoteController.php:230
 * @route '/quotes/{quote}/reject'
 */
reject.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return reject.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::reject
 * @see app/Http/Controllers/QuoteController.php:230
 * @route '/quotes/{quote}/reject'
 */
reject.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reject.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::reject
 * @see app/Http/Controllers/QuoteController.php:230
 * @route '/quotes/{quote}/reject'
 */
    const rejectForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: reject.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::reject
 * @see app/Http/Controllers/QuoteController.php:230
 * @route '/quotes/{quote}/reject'
 */
        rejectForm.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: reject.url(args, options),
            method: 'post',
        })
    
    reject.form = rejectForm
/**
* @see \App\Http\Controllers\QuoteController::convertToPolicy
 * @see app/Http/Controllers/QuoteController.php:250
 * @route '/quotes/{quote}/convert-to-policy'
 */
export const convertToPolicy = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertToPolicy.url(args, options),
    method: 'post',
})

convertToPolicy.definition = {
    methods: ["post"],
    url: '/quotes/{quote}/convert-to-policy',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::convertToPolicy
 * @see app/Http/Controllers/QuoteController.php:250
 * @route '/quotes/{quote}/convert-to-policy'
 */
convertToPolicy.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return convertToPolicy.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::convertToPolicy
 * @see app/Http/Controllers/QuoteController.php:250
 * @route '/quotes/{quote}/convert-to-policy'
 */
convertToPolicy.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: convertToPolicy.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::convertToPolicy
 * @see app/Http/Controllers/QuoteController.php:250
 * @route '/quotes/{quote}/convert-to-policy'
 */
    const convertToPolicyForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: convertToPolicy.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::convertToPolicy
 * @see app/Http/Controllers/QuoteController.php:250
 * @route '/quotes/{quote}/convert-to-policy'
 */
        convertToPolicyForm.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: convertToPolicy.url(args, options),
            method: 'post',
        })
    
    convertToPolicy.form = convertToPolicyForm
/**
* @see \App\Http\Controllers\QuoteController::duplicate
 * @see app/Http/Controllers/QuoteController.php:267
 * @route '/quotes/{quote}/duplicate'
 */
export const duplicate = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

duplicate.definition = {
    methods: ["post"],
    url: '/quotes/{quote}/duplicate',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::duplicate
 * @see app/Http/Controllers/QuoteController.php:267
 * @route '/quotes/{quote}/duplicate'
 */
duplicate.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return duplicate.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::duplicate
 * @see app/Http/Controllers/QuoteController.php:267
 * @route '/quotes/{quote}/duplicate'
 */
duplicate.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: duplicate.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::duplicate
 * @see app/Http/Controllers/QuoteController.php:267
 * @route '/quotes/{quote}/duplicate'
 */
    const duplicateForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: duplicate.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::duplicate
 * @see app/Http/Controllers/QuoteController.php:267
 * @route '/quotes/{quote}/duplicate'
 */
        duplicateForm.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: duplicate.url(args, options),
            method: 'post',
        })
    
    duplicate.form = duplicateForm
/**
* @see \App\Http\Controllers\QuoteController::extendValidity
 * @see app/Http/Controllers/QuoteController.php:284
 * @route '/quotes/{quote}/extend-validity'
 */
export const extendValidity = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extendValidity.url(args, options),
    method: 'post',
})

extendValidity.definition = {
    methods: ["post"],
    url: '/quotes/{quote}/extend-validity',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuoteController::extendValidity
 * @see app/Http/Controllers/QuoteController.php:284
 * @route '/quotes/{quote}/extend-validity'
 */
extendValidity.url = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { quote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { quote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    quote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        quote: typeof args.quote === 'object'
                ? args.quote.id
                : args.quote,
                }

    return extendValidity.definition.url
            .replace('{quote}', parsedArgs.quote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::extendValidity
 * @see app/Http/Controllers/QuoteController.php:284
 * @route '/quotes/{quote}/extend-validity'
 */
extendValidity.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: extendValidity.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\QuoteController::extendValidity
 * @see app/Http/Controllers/QuoteController.php:284
 * @route '/quotes/{quote}/extend-validity'
 */
    const extendValidityForm = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: extendValidity.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\QuoteController::extendValidity
 * @see app/Http/Controllers/QuoteController.php:284
 * @route '/quotes/{quote}/extend-validity'
 */
        extendValidityForm.post = (args: { quote: number | { id: number } } | [quote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: extendValidity.url(args, options),
            method: 'post',
        })
    
    extendValidity.form = extendValidityForm
/**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
export const exportPdf = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})

exportPdf.definition = {
    methods: ["get","head"],
    url: '/quotes-export/pdf',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
exportPdf.url = (options?: RouteQueryOptions) => {
    return exportPdf.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
exportPdf.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: exportPdf.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
exportPdf.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: exportPdf.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
    const exportPdfForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: exportPdf.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
        exportPdfForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportPdf.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\QuoteController::exportPdf
 * @see app/Http/Controllers/QuoteController.php:304
 * @route '/quotes-export/pdf'
 */
        exportPdfForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: exportPdf.url({
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    exportPdf.form = exportPdfForm
const quotes = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
send: Object.assign(send, send),
accept: Object.assign(accept, accept),
reject: Object.assign(reject, reject),
convertToPolicy: Object.assign(convertToPolicy, convertToPolicy),
duplicate: Object.assign(duplicate, duplicate),
extendValidity: Object.assign(extendValidity, extendValidity),
exportPdf: Object.assign(exportPdf, exportPdf),
}

export default quotes