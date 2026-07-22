<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClauseLibraryRequest;
use App\Http\Requests\UpdateClauseLibraryRequest;
use App\Models\ClauseLibrary;
use App\Models\PolicyClass;
use App\Services\ClauseLibraryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClauseLibraryController extends Controller
{
    public function __construct(
        protected ClauseLibraryService $clauseLibraryService,
    ) {}

    public function index(Request $request): Response
    {
        $clauses = ClauseLibrary::query()
            ->where(function ($q) use ($request) {
                $q->whereNull('tenant_id')
                    ->orWhere('tenant_id', $request->user()->tenant_id);
            })
            ->with('policyClass:id,name')
            ->orderBy('clause_type')
            ->orderBy('sort_order')
            ->paginate(50);

        return Inertia::render('clause-library/Index', [
            'clauses' => $clauses,
            'policyClasses' => PolicyClass::select('id', 'name', 'code')->get(),
        ]);
    }

    public function store(StoreClauseLibraryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $this->clauseLibraryService->createClause($request->user(), $validated);

        return to_route('clause-library.index');
    }

    public function update(UpdateClauseLibraryRequest $request, ClauseLibrary $clauseLibrary): RedirectResponse
    {
        $validated = $request->validated();

        $this->clauseLibraryService->updateClause($clauseLibrary, $validated);

        return to_route('clause-library.index');
    }

    public function destroy(ClauseLibrary $clauseLibrary): RedirectResponse
    {
        $this->clauseLibraryService->deleteClause($clauseLibrary);

        return to_route('clause-library.index');
    }
}
