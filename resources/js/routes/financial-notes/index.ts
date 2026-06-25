import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
 */
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/financial-notes',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
 */
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
 */
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
 */
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
 */
    const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: index.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
 */
        indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: index.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::index
 * @see app/Http/Controllers/FinancialNoteController.php:15
 * @route '/financial-notes'
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
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
 */
export const create = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})

create.definition = {
    methods: ["get","head"],
    url: '/financial-notes/create',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
 */
create.url = (options?: RouteQueryOptions) => {
    return create.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
 */
create.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: create.url(options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
 */
create.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: create.url(options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
 */
    const createForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: create.url(options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
 */
        createForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: create.url(options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::create
 * @see app/Http/Controllers/FinancialNoteController.php:62
 * @route '/financial-notes/create'
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
* @see \App\Http\Controllers\FinancialNoteController::store
 * @see app/Http/Controllers/FinancialNoteController.php:81
 * @route '/financial-notes'
 */
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/financial-notes',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::store
 * @see app/Http/Controllers/FinancialNoteController.php:81
 * @route '/financial-notes'
 */
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::store
 * @see app/Http/Controllers/FinancialNoteController.php:81
 * @route '/financial-notes'
 */
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::store
 * @see app/Http/Controllers/FinancialNoteController.php:81
 * @route '/financial-notes'
 */
    const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: store.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::store
 * @see app/Http/Controllers/FinancialNoteController.php:81
 * @route '/financial-notes'
 */
        storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: store.url(options),
            method: 'post',
        })
    
    store.form = storeForm
/**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
export const show = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/financial-notes/{financial_note}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
show.url = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financial_note: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    financial_note: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financial_note: args.financial_note,
                }

    return show.definition.url
            .replace('{financial_note}', parsedArgs.financial_note.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
show.get = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
show.head = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
    const showForm = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: show.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
        showForm.get = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: show.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::show
 * @see app/Http/Controllers/FinancialNoteController.php:94
 * @route '/financial-notes/{financial_note}'
 */
        showForm.head = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
export const edit = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})

edit.definition = {
    methods: ["get","head"],
    url: '/financial-notes/{financial_note}/edit',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
edit.url = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financial_note: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    financial_note: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financial_note: args.financial_note,
                }

    return edit.definition.url
            .replace('{financial_note}', parsedArgs.financial_note.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
edit.get = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: edit.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
edit.head = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: edit.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
    const editForm = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: edit.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
        editForm.get = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: edit.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::edit
 * @see app/Http/Controllers/FinancialNoteController.php:103
 * @route '/financial-notes/{financial_note}/edit'
 */
        editForm.head = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
export const update = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/financial-notes/{financial_note}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
update.url = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financial_note: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    financial_note: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financial_note: args.financial_note,
                }

    return update.definition.url
            .replace('{financial_note}', parsedArgs.financial_note.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
update.put = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
update.patch = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
    const updateForm = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: update.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'PUT',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
        updateForm.put = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: update.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'PUT',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'post',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::update
 * @see app/Http/Controllers/FinancialNoteController.php:122
 * @route '/financial-notes/{financial_note}'
 */
        updateForm.patch = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\FinancialNoteController::destroy
 * @see app/Http/Controllers/FinancialNoteController.php:134
 * @route '/financial-notes/{financial_note}'
 */
export const destroy = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/financial-notes/{financial_note}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::destroy
 * @see app/Http/Controllers/FinancialNoteController.php:134
 * @route '/financial-notes/{financial_note}'
 */
destroy.url = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financial_note: args }
    }

    
    if (Array.isArray(args)) {
        args = {
                    financial_note: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financial_note: args.financial_note,
                }

    return destroy.definition.url
            .replace('{financial_note}', parsedArgs.financial_note.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::destroy
 * @see app/Http/Controllers/FinancialNoteController.php:134
 * @route '/financial-notes/{financial_note}'
 */
destroy.delete = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::destroy
 * @see app/Http/Controllers/FinancialNoteController.php:134
 * @route '/financial-notes/{financial_note}'
 */
    const destroyForm = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: destroy.url(args, {
                    [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                        _method: 'DELETE',
                        ...(options?.query ?? options?.mergeQuery ?? {}),
                    }
                }),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::destroy
 * @see app/Http/Controllers/FinancialNoteController.php:134
 * @route '/financial-notes/{financial_note}'
 */
        destroyForm.delete = (args: { financial_note: string | number } | [financial_note: string | number ] | string | number, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see \App\Http\Controllers\FinancialNoteController::issue
 * @see app/Http/Controllers/FinancialNoteController.php:146
 * @route '/financial-notes/{financialNote}/issue'
 */
export const issue = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: issue.url(args, options),
    method: 'post',
})

issue.definition = {
    methods: ["post"],
    url: '/financial-notes/{financialNote}/issue',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::issue
 * @see app/Http/Controllers/FinancialNoteController.php:146
 * @route '/financial-notes/{financialNote}/issue'
 */
issue.url = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financialNote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { financialNote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    financialNote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financialNote: typeof args.financialNote === 'object'
                ? args.financialNote.id
                : args.financialNote,
                }

    return issue.definition.url
            .replace('{financialNote}', parsedArgs.financialNote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::issue
 * @see app/Http/Controllers/FinancialNoteController.php:146
 * @route '/financial-notes/{financialNote}/issue'
 */
issue.post = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: issue.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::issue
 * @see app/Http/Controllers/FinancialNoteController.php:146
 * @route '/financial-notes/{financialNote}/issue'
 */
    const issueForm = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: issue.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::issue
 * @see app/Http/Controllers/FinancialNoteController.php:146
 * @route '/financial-notes/{financialNote}/issue'
 */
        issueForm.post = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: issue.url(args, options),
            method: 'post',
        })
    
    issue.form = issueForm
/**
* @see \App\Http\Controllers\FinancialNoteController::markPaid
 * @see app/Http/Controllers/FinancialNoteController.php:160
 * @route '/financial-notes/{financialNote}/mark-paid'
 */
export const markPaid = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markPaid.url(args, options),
    method: 'post',
})

markPaid.definition = {
    methods: ["post"],
    url: '/financial-notes/{financialNote}/mark-paid',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::markPaid
 * @see app/Http/Controllers/FinancialNoteController.php:160
 * @route '/financial-notes/{financialNote}/mark-paid'
 */
markPaid.url = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financialNote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { financialNote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    financialNote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financialNote: typeof args.financialNote === 'object'
                ? args.financialNote.id
                : args.financialNote,
                }

    return markPaid.definition.url
            .replace('{financialNote}', parsedArgs.financialNote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::markPaid
 * @see app/Http/Controllers/FinancialNoteController.php:160
 * @route '/financial-notes/{financialNote}/mark-paid'
 */
markPaid.post = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: markPaid.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::markPaid
 * @see app/Http/Controllers/FinancialNoteController.php:160
 * @route '/financial-notes/{financialNote}/mark-paid'
 */
    const markPaidForm = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: markPaid.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::markPaid
 * @see app/Http/Controllers/FinancialNoteController.php:160
 * @route '/financial-notes/{financialNote}/mark-paid'
 */
        markPaidForm.post = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: markPaid.url(args, options),
            method: 'post',
        })
    
    markPaid.form = markPaidForm
/**
* @see \App\Http\Controllers\FinancialNoteController::cancel
 * @see app/Http/Controllers/FinancialNoteController.php:184
 * @route '/financial-notes/{financialNote}/cancel'
 */
export const cancel = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/financial-notes/{financialNote}/cancel',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::cancel
 * @see app/Http/Controllers/FinancialNoteController.php:184
 * @route '/financial-notes/{financialNote}/cancel'
 */
cancel.url = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financialNote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { financialNote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    financialNote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financialNote: typeof args.financialNote === 'object'
                ? args.financialNote.id
                : args.financialNote,
                }

    return cancel.definition.url
            .replace('{financialNote}', parsedArgs.financialNote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::cancel
 * @see app/Http/Controllers/FinancialNoteController.php:184
 * @route '/financial-notes/{financialNote}/cancel'
 */
cancel.post = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::cancel
 * @see app/Http/Controllers/FinancialNoteController.php:184
 * @route '/financial-notes/{financialNote}/cancel'
 */
    const cancelForm = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: cancel.url(args, options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::cancel
 * @see app/Http/Controllers/FinancialNoteController.php:184
 * @route '/financial-notes/{financialNote}/cancel'
 */
        cancelForm.post = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: cancel.url(args, options),
            method: 'post',
        })
    
    cancel.form = cancelForm
/**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
export const download = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})

download.definition = {
    methods: ["get","head"],
    url: '/financial-notes/{financialNote}/download',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
download.url = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { financialNote: args }
    }

            if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
            args = { financialNote: args.id }
        }
    
    if (Array.isArray(args)) {
        args = {
                    financialNote: args[0],
                }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
                        financialNote: typeof args.financialNote === 'object'
                ? args.financialNote.id
                : args.financialNote,
                }

    return download.definition.url
            .replace('{financialNote}', parsedArgs.financialNote.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
download.get = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: download.url(args, options),
    method: 'get',
})
/**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
download.head = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: download.url(args, options),
    method: 'head',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
    const downloadForm = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
        action: download.url(args, options),
        method: 'get',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
        downloadForm.get = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(args, options),
            method: 'get',
        })
            /**
* @see \App\Http\Controllers\FinancialNoteController::download
 * @see app/Http/Controllers/FinancialNoteController.php:195
 * @route '/financial-notes/{financialNote}/download'
 */
        downloadForm.head = (args: { financialNote: number | { id: number } } | [financialNote: number | { id: number } ] | number | { id: number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
            action: download.url(args, {
                        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
                            _method: 'HEAD',
                            ...(options?.query ?? options?.mergeQuery ?? {}),
                        }
                    }),
            method: 'get',
        })
    
    download.form = downloadForm
/**
* @see \App\Http\Controllers\FinancialNoteController::bulkAction
 * @see app/Http/Controllers/FinancialNoteController.php:218
 * @route '/financial-notes/bulk-action'
 */
export const bulkAction = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkAction.url(options),
    method: 'post',
})

bulkAction.definition = {
    methods: ["post"],
    url: '/financial-notes/bulk-action',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\FinancialNoteController::bulkAction
 * @see app/Http/Controllers/FinancialNoteController.php:218
 * @route '/financial-notes/bulk-action'
 */
bulkAction.url = (options?: RouteQueryOptions) => {
    return bulkAction.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\FinancialNoteController::bulkAction
 * @see app/Http/Controllers/FinancialNoteController.php:218
 * @route '/financial-notes/bulk-action'
 */
bulkAction.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: bulkAction.url(options),
    method: 'post',
})

    /**
* @see \App\Http\Controllers\FinancialNoteController::bulkAction
 * @see app/Http/Controllers/FinancialNoteController.php:218
 * @route '/financial-notes/bulk-action'
 */
    const bulkActionForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
        action: bulkAction.url(options),
        method: 'post',
    })

            /**
* @see \App\Http\Controllers\FinancialNoteController::bulkAction
 * @see app/Http/Controllers/FinancialNoteController.php:218
 * @route '/financial-notes/bulk-action'
 */
        bulkActionForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
            action: bulkAction.url(options),
            method: 'post',
        })
    
    bulkAction.form = bulkActionForm
const financialNotes = {
    index: Object.assign(index, index),
create: Object.assign(create, create),
store: Object.assign(store, store),
show: Object.assign(show, show),
edit: Object.assign(edit, edit),
update: Object.assign(update, update),
destroy: Object.assign(destroy, destroy),
issue: Object.assign(issue, issue),
markPaid: Object.assign(markPaid, markPaid),
cancel: Object.assign(cancel, cancel),
download: Object.assign(download, download),
bulkAction: Object.assign(bulkAction, bulkAction),
}

export default financialNotes