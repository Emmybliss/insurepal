<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentAsset;
use App\Models\DocumentOverlay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DocumentOverlayController extends Controller
{
    public function store(Request $request, Document $document)
    {
        if ($document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $request->validate([
            'type' => 'required|string',
            'page_number' => 'nullable|integer',
            'position_x' => 'required|numeric',
            'position_y' => 'required|numeric',
            'width' => 'required|numeric',
            'height' => 'required|numeric',
            'rotation' => 'nullable|numeric',
            'content' => 'nullable|string',
            'settings' => 'nullable|array',
        ]);

        $overlay = $document->overlays()->create($request->all());

        return response()->json($overlay);
    }

    public function update(Request $request, DocumentOverlay $overlay)
    {
        if ($overlay->document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $overlay->update($request->all());

        return response()->json($overlay);
    }

    public function destroy(DocumentOverlay $overlay)
    {
        if ($overlay->document->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        $overlay->delete();

        return response()->json(['success' => true]);
    }

    public function getAssets()
    {
        $tenantId = Auth::user()->tenant_id ?? 1;
        $assets = DocumentAsset::where('tenant_id', $tenantId)->get()->map(function ($asset) {
            $asset->url = route('document-toolkit.branding.asset-file', $asset->id);

            return $asset;
        });

        return response()->json($assets);
    }

    public function storeAsset(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:10240',
            'type' => 'required|string|in:signature,stamp,letterhead,footer',
            'name' => 'required|string|max:255',
        ]);

        $tenantId = Auth::user()->tenant_id ?? 1;
        $path = $request->file('file')->store("tenants/{$tenantId}/document_assets", 'local');

        $asset = DocumentAsset::create([
            'tenant_id' => $tenantId,
            'type' => $request->type,
            'name' => $request->name,
            'file_path' => $path,
        ]);

        $asset->url = route('document-toolkit.branding.asset-file', $asset->id);

        return response()->json($asset);
    }

    public function getAssetFile(DocumentAsset $asset)
    {
        if ($asset->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        if (! Storage::disk('local')->exists($asset->file_path)) {
            abort(404);
        }

        return response()->file(Storage::disk('local')->path($asset->file_path));
    }

    public function deleteAsset(DocumentAsset $asset)
    {
        if ($asset->tenant_id !== (Auth::user()->tenant_id ?? 1)) {
            abort(403);
        }

        Storage::disk('local')->delete($asset->file_path);
        $asset->delete();

        return response()->json(['success' => true]);
    }
}
