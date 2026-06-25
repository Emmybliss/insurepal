<?php

namespace App\Services;

use App\Models\CommunicationAttachment;
use App\Models\CommunicationMessage;
use Illuminate\Http\Response;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CommunicationAttachmentService
{
    public function upload(UploadedFile $file, CommunicationMessage $message): CommunicationAttachment
    {
        $path = $file->store('communication-attachments', 'public');

        return CommunicationAttachment::create([
            'message_id' => $message->id,
            'disk' => 'public',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);
    }

    public function download(CommunicationAttachment $attachment): Response
    {
        $disk = Storage::disk($attachment->disk);

        if (! $disk->exists($attachment->path)) {
            abort(404, 'File not found');
        }

        return $disk->download($attachment->path, $attachment->original_name, [
            'Content-Type' => $attachment->mime_type,
        ]);
    }

    public function delete(CommunicationAttachment $attachment): void
    {
        Storage::disk($attachment->disk)->delete($attachment->path);
        $attachment->delete();
    }

    public function authorizeDownload(CommunicationAttachment $attachment, int $userId): bool
    {
        $message = $attachment->message;
        $thread = $message->thread;

        return $thread->isParticipant($userId);
    }

    public function getAttachmentsForMessage(CommunicationMessage $message): \Illuminate\Database\Eloquent\Collection
    {
        return $message->attachments()->get();
    }

    public function validateFile(UploadedFile $file, array $rules = []): bool
    {
        $maxSize = $rules['max_size'] ?? 10240;
        $allowedMimes = $rules['allowed_mimes'] ?? [];

        if ($file->getSize() > $maxSize * 1024) {
            return false;
        }

        if (! empty($allowedMimes) && ! in_array($file->getMimeType(), $allowedMimes)) {
            return false;
        }

        return true;
    }
}
