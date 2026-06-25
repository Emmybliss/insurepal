<?php

namespace App\Http\Controllers;

use App\Models\CommunicationAttachment;
use App\Services\CommunicationAttachmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommunicationAttachmentController extends Controller
{
    public function __construct(
        private CommunicationAttachmentService $attachmentService
    ) {}

    public function download(CommunicationAttachment $attachment)
    {
        $user = Auth::user();

        if (! $this->attachmentService->authorizeDownload($attachment, $user->id)) {
            abort(403, 'You are not authorized to download this attachment.');
        }

        return $this->attachmentService->download($attachment);
    }

    public function destroy(CommunicationAttachment $attachment, Request $request)
    {
        $user = Auth::user();

        $message = $attachment->message;

        if (! $message->thread->isParticipant($user->id)) {
            abort(403, 'You are not authorized to delete this attachment.');
        }

        if ($message->sender_id !== $user->id) {
            abort(403, 'Only the sender can delete attachments.');
        }

        $this->attachmentService->delete($attachment);

        return back()->with('success', 'Attachment deleted successfully.');
    }
}
