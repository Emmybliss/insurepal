<?php

namespace App\Http\Controllers;

use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseCategory;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HelpController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()?->tenant_id;

        // Get popular articles
        $popularArticles = KnowledgeBaseArticle::published()
            ->public()
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->orderBy('view_count', 'desc')
            ->limit(6)
            ->get();

        // Get categories with article counts
        $categories = KnowledgeBaseCategory::active()
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->withCount(['articles' => function ($query) {
                $query->published()->public();
            }])
            ->orderBy('sort_order')
            ->get();

        // Get recent articles
        $recentArticles = KnowledgeBaseArticle::published()
            ->public()
            ->when($tenantId, fn ($query) => $query->where('tenant_id', $tenantId))
            ->orderBy('published_at', 'desc')
            ->limit(4)
            ->get();

        return Inertia::render('help/Index', [
            'popularArticles' => $popularArticles,
            'categories' => $categories,
            'recentArticles' => $recentArticles,
        ]);
    }
}
