<?php

use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseCategory;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->tenant = Tenant::factory()->create();
    $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    $this->actingAs($this->user);
});

it('can view knowledge base articles', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $article = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
    ]);

    $response = $this->get(route('kb.index'));

    $response->assertSuccessful();
    $response->assertSee($article->title);
});

it('can view a specific knowledge base article', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $article = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
    ]);

    $response = $this->get(route('kb.show', $article->slug));

    $response->assertSuccessful();
    $response->assertSee($article->title);
});

it('can create a knowledge base article', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $articleData = [
        'title' => 'Test Article',
        'slug' => 'test-article',
        'content' => 'This is test content',
        'excerpt' => 'Test excerpt',
        'category_id' => $category->id,
        'status' => 'draft',
        'is_public' => true,
    ];

    $response = $this->post(route('admin.kb.articles.store'), $articleData);

    $response->assertRedirect();
    $this->assertDatabaseHas('kb_articles', [
        'title' => 'Test Article',
        'slug' => 'test-article',
        'content' => 'This is test content',
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'tenant_id' => $this->tenant->id,
    ]);
});

it('can update a knowledge base article', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $article = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
    ]);

    $updateData = [
        'title' => 'Updated Article Title',
        'content' => 'Updated content',
        'status' => 'published',
    ];

    $response = $this->put(route('admin.kb.articles.update', $article), $updateData);

    $response->assertRedirect();
    $this->assertDatabaseHas('kb_articles', [
        'id' => $article->id,
        'title' => 'Updated Article Title',
        'content' => 'Updated content',
        'status' => 'published',
    ]);
});

it('can record feedback on an article', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $article = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
    ]);

    $feedbackData = [
        'helpful' => true,
        'comment' => 'This article was very helpful!',
    ];

    $response = $this->post(route('kb.feedback', $article), $feedbackData);

    $response->assertSuccessful();
    $this->assertDatabaseHas('kb_articles', [
        'id' => $article->id,
        'helpful_count' => 1,
    ]);
});

it('can increment view count when viewing an article', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $article = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
        'view_count' => 0,
    ]);

    $response = $this->get(route('kb.show', $article->slug));

    $response->assertSuccessful();
    $this->assertDatabaseHas('kb_articles', [
        'id' => $article->id,
        'view_count' => 1,
    ]);
});

it('can search knowledge base articles', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $article1 = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'title' => 'Laravel Tutorial',
        'status' => 'published',
        'is_public' => true,
    ]);

    $article2 = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'title' => 'PHP Basics',
        'status' => 'published',
        'is_public' => true,
    ]);

    $response = $this->get(route('kb.index', ['search' => 'Laravel']));

    $response->assertSuccessful();
    $response->assertSee('Laravel Tutorial');
    $response->assertDontSee('PHP Basics');
});

it('can filter articles by category', function () {
    $category1 = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Laravel',
        'slug' => 'laravel',
    ]);

    $category2 = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
        'name' => 'PHP',
        'slug' => 'php',
    ]);

    $article1 = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category1->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
    ]);

    $article2 = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category2->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
    ]);

    $response = $this->get(route('kb.index', ['category' => 'laravel']));

    $response->assertSuccessful();
    $response->assertSee($article1->title);
    $response->assertDontSee($article2->title);
});

it('only shows public articles to non-authenticated users', function () {
    $category = KnowledgeBaseCategory::factory()->create([
        'tenant_id' => $this->tenant->id,
    ]);

    $publicArticle = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => true,
    ]);

    $privateArticle = KnowledgeBaseArticle::factory()->create([
        'tenant_id' => $this->tenant->id,
        'category_id' => $category->id,
        'author_id' => $this->user->id,
        'status' => 'published',
        'is_public' => false,
    ]);

    auth()->logout();

    $response = $this->get(route('kb.index'));

    $response->assertSuccessful();
    $response->assertSee($publicArticle->title);
    $response->assertDontSee($privateArticle->title);
});

it('requires authentication to manage articles', function () {
    auth()->logout();

    $response = $this->get(route('admin.kb.articles.index'));
    $response->assertRedirect(route('login'));
});

it('validates required fields when creating an article', function () {
    $response = $this->post(route('admin.kb.articles.store'), []);

    $response->assertSessionHasErrors(['title', 'content', 'category_id']);
});
