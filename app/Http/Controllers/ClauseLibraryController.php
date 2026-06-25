<?php

namespace App\Http\Controllers;

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

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'clause_type' => ['required', 'string', 'in:coverage,warranty,exclusion,subjectivity,condition,special'],
            'title' => ['required', 'string', 'max:200'],
            'content' => ['required', 'string'],
            'policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $this->clauseLibraryService->createClause($validated);

        return to_route('clause-library.index');
    }

    public function update(Request $request, ClauseLibrary $clauseLibrary): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'content' => ['sometimes', 'string'],
            'clause_type' => ['sometimes', 'string', 'in:coverage,warranty,exclusion,subjectivity,condition,special'],
            'policy_class_id' => ['nullable', 'exists:policy_classes,id'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $this->clauseLibraryService->updateClause($clauseLibrary, $validated);

        return to_route('clause-library.index');
    }

    public function destroy(ClauseLibrary $clauseLibrary): RedirectResponse
    {
        $this->clauseLibraryService->deleteClause($clauseLibrary);

        return to_route('clause-library.index');
    }
}
