<?php

namespace App\Http\Controllers;

use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseCategory;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KnowledgeBaseController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()?->tenant_id;

        $articles = KnowledgeBaseArticle::published()
            ->public()
            ->with(['category', 'author'])
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->orderBy('published_at', 'desc')
            ->limit(12)
            ->get();

        $categories = KnowledgeBaseCategory::active()
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->withCount(['articles' => function ($query) {
                $query->published()->public();
            }])
            ->orderBy('sort_order')
            ->get();

        $popularArticles = KnowledgeBaseArticle::published()
            ->public()
            ->with(['category', 'author'])
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->orderBy('view_count', 'desc')
            ->limit(6)
            ->get();

        $recentArticles = KnowledgeBaseArticle::published()
            ->public()
            ->with(['category', 'author'])
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->orderBy('published_at', 'desc')
            ->limit(4)
            ->get();

        return Inertia::render('help/articles/index', [
            'articles' => $articles,
            'categories' => $categories,
            'popularArticles' => $popularArticles,
            'recentArticles' => $recentArticles,
            'featuredArticles' => $articles->take(3),
            'categoryFilter' => request('category', ''),
            'searchQuery' => request('q', ''),
            'sortBy' => 'published_at',
            'sortOrder' => 'desc',
            'canManageArticles' => false,
        ]);
    }

    public function show(KnowledgeBaseArticle $article)
    {
        $article->load(['category', 'author']);

        return Inertia::render('help/articles/show', [
            'article' => $article,
        ]);
    }

    public function recordFeedback(KnowledgeBaseArticle $article)
    {
        $isHelpful = request()->boolean('helpful');

        $article->recordFeedback($isHelpful);

        return response()->json(['success' => true]);
    }
}
