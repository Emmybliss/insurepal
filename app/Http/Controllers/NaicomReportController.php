<?php

namespace App\Http\Controllers;

use App\Enums\AdjustmentStatus;
use App\Enums\ReportStatus;
use App\Models\NaicomAdjustment;
use App\Models\NaicomReportLine;
use App\Models\NaicomReportRun;
use App\Services\Naicom\NaicomCommissionRecognitionService;
use App\Services\Naicom\NaicomExcelExportService;
use App\Services\Naicom\NaicomForm72BService;
use App\Services\Naicom\NaicomReportService;
use App\Services\Naicom\NaicomValidationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NaicomReportController extends Controller
{
    public function __construct(
        protected NaicomReportService $reportService,
        protected NaicomForm72BService $form72BService,
        protected NaicomCommissionRecognitionService $commissionService,
        protected NaicomValidationService $validationService,
    ) {}

    public function index()
    {
        $this->authorize('naicom-reports.view');

        $runs = NaicomReportRun::query()
            ->with(['generatedBy', 'approvedBy'])
            ->latest()
            ->paginate(15);

        return Inertia::render('reports/naicom/index', [
            'runs' => $runs,
        ]);
    }

    public function create()
    {
        $this->authorize('naicom-reports.generate');

        return Inertia::render('reports/naicom/create');
    }

    public function store(Request $request)
    {
        $this->authorize('naicom-reports.generate');

        $validated = $request->validate([
            'reporting_year' => 'required|integer|min:2020|max:2099',
            'reporting_half' => 'required|in:H1,H2',
            'commission_recognition_date' => 'nullable|date',
        ]);

        $run = NaicomReportRun::create([
            'tenant_id' => auth()->user()->tenant_id,
            'reporting_year' => $validated['reporting_year'],
            'reporting_half' => $validated['reporting_half'],
            'commission_recognition_date' => $validated['commission_recognition_date'] ?? null,
            'generated_by' => auth()->id(),
        ]);

        try {
            $this->reportService->generate($run);
        } catch (\Throwable $e) {
            return redirect()->route('reports.naicom.show', $run)
                ->with('error', 'Report generation failed: '.$e->getMessage());
        }

        return redirect()->route('reports.naicom.show', $run);
    }

    public function show(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.view');

        $reportRun->load(['generatedBy', 'approvedBy', 'lines']);

        $form = request('form', '7.2B');

        $lines = $reportRun->lines()
            ->where('form_type', $form)
            ->orderBy('row_number')
            ->get();

        $data = $lines->pluck('data')->toArray();

        $monthlySummaries = match ($form) {
            '7.2A' => $reportRun->metadata['form_72a']['monthly_summaries'] ?? [],
            '7.2C' => $reportRun->metadata['form_72c']['monthly_summaries'] ?? [],
            default => $reportRun->metadata['form_72b']['monthly_summaries'] ?? [],
        };

        $hasAdjustments = $reportRun->adjustments()->exists();

        return Inertia::render('reports/naicom/show', [
            'run' => $reportRun,
            'form' => $form,
            'lines' => $data,
            'monthlySummaries' => $monthlySummaries,
            'hasAdjustments' => $hasAdjustments,
        ]);
    }

    public function form72B(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.view');

        return redirect()->route('reports.naicom.show', [
            'reportRun' => $reportRun,
            'form' => '7.2B',
        ]);
    }

    public function form72A(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.view');

        return redirect()->route('reports.naicom.show', [
            'reportRun' => $reportRun,
            'form' => '7.2A',
        ]);
    }

    public function form72C(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.view');

        return redirect()->route('reports.naicom.show', [
            'reportRun' => $reportRun,
            'form' => '7.2C',
        ]);
    }

    public function validateReport(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.review');

        $result = $this->validationService->validate($reportRun);

        if ($result['has_errors']) {
            return back()->with([
                'validation' => $result,
                'error' => 'Validation failed with '.count($result['errors']).' error(s).',
            ]);
        }

        return back()->with([
            'validation' => $result,
            'success' => 'Validation passed'.($result['has_warnings'] ? ' with '.count($result['warnings']).' warning(s).' : '.'),
        ]);
    }

    public function submitForReview(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.review');

        abort_if($reportRun->status->value !== 'generated', 422, 'Report must be in generated status to submit for review.');

        $reportRun->update(['status' => ReportStatus::UnderReview, 'reviewed_by' => auth()->id()]);

        return back();
    }

    public function approve(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.approve');

        abort_if($reportRun->status->value !== 'under_review', 422, 'Report must be under review to approve.');

        $reportRun->update([
            'status' => ReportStatus::Approved,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return back();
    }

    public function lock(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.lock');

        abort_if($reportRun->status->value !== 'approved', 422, 'Report must be approved before locking.');

        $reportRun->update(['status' => ReportStatus::Locked, 'locked_at' => now()]);

        return back();
    }

    public function export(NaicomReportRun $reportRun, string $format)
    {
        $this->authorize('naicom-reports.export');

        abort_if(! $reportRun->isLocked() && $reportRun->status->value !== 'generated', 422, 'Report must be generated, approved, or locked before export.');

        $form = match ($format) {
            'xlsx-72a' => '7.2A',
            'xlsx-72b' => '7.2B',
            'xlsx-72c' => '7.2C',
            'xlsx' => '7.2B',
            default => abort(422, 'Unsupported export format.'),
        };

        $service = app(NaicomExcelExportService::class);
        $filePath = $service->export($reportRun, $form, auth()->id());

        return $service->downloadResponse($filePath);
    }

    public function storeAdjustment(Request $request, NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.adjust');

        abort_if(! $reportRun->isMutable(), 422, 'Adjustments cannot be made on a locked or restated report.');

        $validated = $request->validate([
            'form_type' => 'required|string|in:7.2A,7.2B,7.2C',
            'report_line_id' => 'nullable|exists:naicom_report_lines,id',
            'field' => 'nullable|string|max:100',
            'calculated_value' => 'nullable|numeric',
            'adjusted_value' => 'required|numeric',
            'reason' => 'required|string|min:10',
            'supporting_document' => 'nullable|string|max:255',
        ]);

        $adjustment = NaicomAdjustment::create([
            'report_run_id' => $reportRun->id,
            'report_line_id' => $validated['report_line_id'] ?? null,
            'form_type' => $validated['form_type'],
            'field' => $validated['field'],
            'calculated_value' => $validated['calculated_value'] ?? null,
            'adjusted_value' => $validated['adjusted_value'],
            'reason' => $validated['reason'],
            'supporting_document' => $validated['supporting_document'] ?? null,
            'created_by' => auth()->id(),
            'status' => AdjustmentStatus::Draft,
        ]);

        if ($validated['report_line_id'] && $validated['field']) {
            $line = NaicomReportLine::find($validated['report_line_id']);
            if ($line) {
                $data = $line->data;
                $data[$validated['field']] = (float) $validated['adjusted_value'];
                $line->update([
                    'data' => $data,
                    'adjusted_amount' => $validated['adjusted_value'],
                    'adjustment_id' => $adjustment->id,
                ]);
            }
        }

        return back();
    }

    public function adjustments(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.view');

        $adjustments = $reportRun->adjustments()->with(['createdBy', 'reviewedBy', 'approvedBy', 'reportLine'])->latest()->get();

        return Inertia::render('reports/naicom/adjustments', [
            'run' => $reportRun,
            'adjustments' => $adjustments,
        ]);
    }

    public function restate(NaicomReportRun $reportRun)
    {
        $this->authorize('naicom-reports.restate');

        abort_if($reportRun->isLocked(), 422, 'Cannot restate a locked or approved report.');
        abort_if($reportRun->status->value === 'generating', 422, 'Cannot restate a report that is currently being generated.');

        $reportRun->update(['status' => ReportStatus::Restated]);

        $newRun = NaicomReportRun::create([
            'tenant_id' => $reportRun->tenant_id,
            'reporting_year' => $reportRun->reporting_year,
            'reporting_half' => $reportRun->reporting_half->value,
            'status' => ReportStatus::Generated,
            'commission_recognition_date' => $reportRun->commission_recognition_date,
            'generated_by' => auth()->id(),
            'metadata' => array_merge($reportRun->metadata ?? [], [
                'restated_from_run_id' => $reportRun->id,
            ]),
        ]);

        foreach ($reportRun->lines()->cursor() as $line) {
            $newLine = $line->replicate(['report_run_id']);
            $newLine->report_run_id = $newRun->id;
            $newLine->adjustment_id = null;
            $newLine->adjusted_amount = null;
            $newLine->save();
        }

        return redirect()->route('reports.naicom.show', $newRun);
    }
}
