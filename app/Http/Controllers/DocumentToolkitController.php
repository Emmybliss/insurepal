<?php

namespace App\Http\Controllers;

use App\Services\DocumentToolkitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DocumentToolkitController extends Controller
{
    protected $toolkitService;

    public function __construct(DocumentToolkitService $toolkitService)
    {
        $this->toolkitService = $toolkitService;
    }

    public function index()
    {
        return Inertia::render('DocumentToolkit/Index');
    }

    public function capabilities()
    {
        return response()->json($this->toolkitService->getCapabilities());
    }

    public function converter()
    {
        return Inertia::render('DocumentToolkit/Tools/Converter');
    }

    public function merger()
    {
        return Inertia::render('DocumentToolkit/Tools/Merger');
    }

    public function compressor()
    {
        return Inertia::render('DocumentToolkit/Tools/DocumentCompressor');
    }

    public function optimizer()
    {
        return Inertia::render('DocumentToolkit/Tools/DocumentCompressor');
    }

    public function pdfOptimizer()
    {
        return Inertia::render('DocumentToolkit/Tools/DocumentCompressor');
    }

    public function batchPdf()
    {
        return Inertia::render('DocumentToolkit/Tools/Converter');
    }

    public function convert(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        $conversionType = $request->input('conversion_type', 'single');

        if ($conversionType === 'batch' && $request->hasFile('images')) {
            $request->validate([
                'images' => 'required|array|min:1',
                'images.*' => 'required|image|max:20480',
                'title' => 'nullable|string|max:255',
            ]);

            try {
                $pdfPath = $this->toolkitService->convertImagesToPdf(
                    $request->file('images'),
                    $request->input('title')
                );

                return response()->download($pdfPath)->deleteFileAfterSend(true);
            } catch (\Throwable $e) {
                Log::error('Document Toolkit - Batch image conversion failed: '.$e->getMessage(), [
                    'exception' => $e,
                ]);

                return response()->json(['message' => 'Batch conversion failed: '.$e->getMessage()], 422);
            }
        }

        $request->validate([
            'file' => 'required|file|max:51200',
            'format' => 'required|string',
        ]);

        try {
            $pdfPath = $this->toolkitService->convertToPdf($request->file('file'));

            return response()->download($pdfPath)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Conversion failed: '.$e->getMessage(), [
                'exception' => $e,
                'file' => $request->file('file') ? $request->file('file')->getClientOriginalName() : 'no file',
            ]);

            return response()->json(['message' => 'Conversion failed: '.$e->getMessage()], 422);
        }
    }

    public function merge(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');
        $request->validate([
            'files' => 'required|array|min:2',
            'files.*' => 'required|file|mimes:pdf|max:51200',
        ]);

        try {
            $pdfPath = $this->toolkitService->mergeDocuments($request->file('files'));

            return response()->download($pdfPath)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Merge failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['message' => 'Merge failed: '.$e->getMessage()], 422);
        }
    }

    public function compress(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:51200',
            'level' => 'required|in:Low,Medium,High',
        ]);

        try {
            $pdfPath = $this->toolkitService->compressPdf($request->file('file'), $request->input('level'));

            return response()->download($pdfPath)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Compression failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['message' => 'Compression failed: '.$e->getMessage()], 422);
        }
    }

    public function optimizeImage(Request $request)
    {
        $request->validate([
            'file' => 'required|file|image|max:20480',
        ]);

        try {
            $imgPath = $this->toolkitService->optimizeImage($request->file('file'));

            return response()->download($imgPath)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Image optimization failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['message' => 'Image optimization failed: '.$e->getMessage()], 422);
        }
    }

    public function optimizePdf(Request $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:51200',
            'level' => 'nullable|in:Low,Medium,High',
        ]);

        try {
            $level = $request->input('level', 'Medium');
            $pdfPath = $this->toolkitService->compressPdf($request->file('file'), $level);

            return response()->download($pdfPath, 'optimized_'.$request->file('file')->getClientOriginalName())
                ->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'PDF optimization failed: '.$e->getMessage()], 422);
        }
    }
}
