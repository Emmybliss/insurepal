<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentToolkitBatchConvertRequest;
use App\Http\Requests\DocumentToolkitCompressRequest;
use App\Http\Requests\DocumentToolkitConvertRequest;
use App\Http\Requests\DocumentToolkitMergeRequest;
use App\Http\Requests\DocumentToolkitOptimizePdfRequest;
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
            $validatedRequest = DocumentToolkitBatchConvertRequest::createFrom($request);
            $validatedRequest->setContainer(app());
            $validatedRequest->validateResolved();

            try {
                $pdfPath = $this->toolkitService->convertImagesToPdf(
                    $validatedRequest->file('images'),
                    $validatedRequest->input('title')
                );

                return $this->safeDownloadAndDelete($pdfPath);
            } catch (\Throwable $e) {
                Log::error('Document Toolkit - Batch image conversion failed: '.$e->getMessage(), [
                    'exception' => $e,
                ]);

                return response()->json(['message' => 'Batch conversion failed: '.$e->getMessage()], 422);
            }
        }

        $validatedRequest = DocumentToolkitConvertRequest::createFrom($request);
        $validatedRequest->setContainer(app());
        $validatedRequest->validateResolved();

        try {
            $pdfPath = $this->toolkitService->convertToPdf($validatedRequest->file('file'));

            return $this->safeDownloadAndDelete($pdfPath);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Conversion failed: '.$e->getMessage(), [
                'exception' => $e,
                'file' => $validatedRequest->file('file') ? $validatedRequest->file('file')->getClientOriginalName() : 'no file',
            ]);

            return response()->json(['message' => 'Conversion failed: '.$e->getMessage()], 422);
        }
    }

    public function merge(DocumentToolkitMergeRequest $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        try {
            $pdfPath = $this->toolkitService->mergeDocuments($request->file('files'));

            return $this->safeDownloadAndDelete($pdfPath);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Merge failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['message' => 'Merge failed: '.$e->getMessage()], 422);
        }
    }

    public function compress(DocumentToolkitCompressRequest $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        try {
            $pdfPath = $this->toolkitService->compressPdf($request->file('file'), $request->input('level'));

            return $this->safeDownloadAndDelete($pdfPath);
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

            return $this->safeDownloadAndDelete($imgPath);
        } catch (\Throwable $e) {
            Log::error('Document Toolkit - Image optimization failed: '.$e->getMessage(), ['exception' => $e]);

            return response()->json(['message' => 'Image optimization failed: '.$e->getMessage()], 422);
        }
    }

    public function optimizePdf(DocumentToolkitOptimizePdfRequest $request)
    {
        set_time_limit(300);
        ini_set('memory_limit', '512M');

        try {
            $level = $request->input('level', 'Medium');
            $pdfPath = $this->toolkitService->compressPdf($request->file('file'), $level);

            return $this->safeDownloadAndDelete($pdfPath, 'optimized_'.$request->file('file')->getClientOriginalName());
        } catch (\Throwable $e) {
            return response()->json(['message' => 'PDF optimization failed: '.$e->getMessage()], 422);
        }
    }
}
