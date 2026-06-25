<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentProcessingController extends Controller
{
    public function generateFinalPdf(Request $request, Document $document)
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf',
        ]);

        $tenantId = Auth::user()->tenant_id ?? 1;

        // Delete previous processed file if it exists
        if ($document->processed_file_path && Storage::disk('local')->exists($document->processed_file_path)) {
            Storage::disk('local')->delete($document->processed_file_path);
        }

        $path = $request->file('file')->store("tenants/{$tenantId}/documents/processed", 'local');

        $document->update([
            'processed_file_path' => $path,
            'status' => 'processed',
            // Decode JSON string sent from FormData and persist alongside the PDF
            'metadata' => array_merge($document->metadata ?? [], [
                'branding_config' => json_decode($request->input('branding_config', '{}'), true) ?? [],
            ]),
        ]);

        return back()->with('success', 'PDF Generated and Saved!');
    }

    /**
     * Save branding configuration without regenerating the PDF.
     * Used for intermediate saves (draft state persistence).
     */
    public function saveBrandingConfig(Request $request, Document $document)
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $request->validate([
            'branding_config' => 'required|array',
        ]);

        $document->update([
            'metadata' => array_merge($document->metadata ?? [], [
                'branding_config' => $request->input('branding_config'),
            ]),
        ]);

        return response()->json(['success' => true]);
    }
}
