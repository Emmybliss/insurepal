<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentVaultController extends Controller
{
    public function index()
    {
        $documents = Document::where('tenant_id', Auth::user()->tenant_id ?? 1)
            ->withCount('overlays')
            ->latest()
            ->paginate(15);

        return Inertia::render('DocumentToolkit/Branding/Index', [
            'documents' => $documents,
        ]);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:20480', // 20MB
            'name' => 'nullable|string|max:255',
        ]);

        $tenantId = Auth::user()->tenant_id ?? 1;
        $name = $request->name ?: $request->file('file')->getClientOriginalName();
        $path = $request->file('file')->store("tenants/{$tenantId}/documents/original", 'local');

        $document = Document::create([
            'tenant_id' => $tenantId,
            'user_id' => Auth::id(),
            'name' => $name,
            'original_file_path' => $path,
            'status' => 'draft',
        ]);

        return redirect()->route('document-toolkit.branding.editor', $document->id);
    }

    public function show(Document $document)
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        return Inertia::render('DocumentToolkit/Branding/Editor', [
            'document' => $document->load('overlays'),
            'originalFileUrl' => route('document-toolkit.branding.file', [$document->id, 'original']),
            'processedFileUrl' => $document->processed_file_path ? route('document-toolkit.branding.file', [$document->id, 'processed']) : null,
            'downloadUrl' => $document->processed_file_path ? route('document-toolkit.branding.download', $document->id) : null,
            // Restored branding state (overlays + HF configs)
            'brandingConfig' => $document->metadata['branding_config'] ?? null,
        ]);
    }

    public function getFile(Document $document, $type = 'original')
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $path = $type === 'processed' ? $document->processed_file_path : $document->original_file_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($path));
    }

    public function download(Document $document)
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $path = $document->processed_file_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404, 'Processed document not found.');
        }

        return response()->download(
            Storage::disk('local')->path($path),
            $document->name.'_branded.pdf',
            ['Content-Type' => 'application/pdf']
        );
    }

    public function delete(Document $document)
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        Storage::disk('local')->delete($document->original_file_path);
        if ($document->processed_file_path) {
            Storage::disk('local')->delete($document->processed_file_path);
        }

        $document->delete();

        return back()->with('success', 'Document deleted successfully.');
    }
}
