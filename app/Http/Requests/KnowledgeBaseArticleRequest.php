<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KnowledgeBaseArticleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create_kb_articles');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'content' => 'required|string|min:50',
            'category_id' => 'required|integer|exists:kb_categories,id',
            'status' => 'required|string|in:draft,published,archived',
            'is_public' => 'boolean',
            'meta_description' => 'nullable|string|max:160',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Please enter a title for the article.',
            'title.max' => 'Title cannot exceed 255 characters.',
            'content.required' => 'Please provide content for the article.',
            'content.min' => 'Content must be at least 50 characters long.',
            'category_id.required' => 'Please select a category for the article.',
            'category_id.exists' => 'Selected category is invalid.',
            'status.required' => 'Please select a status for the article.',
            'status.in' => 'Invalid status selected.',
            'meta_description.max' => 'Meta description cannot exceed 160 characters.',
        ];
    }
}
