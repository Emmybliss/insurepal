<?php

namespace App\Http\Resources\Api\V1;

use App\Models\ClaimDocument;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClaimDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var ClaimDocument $this */
        return [
            'id' => $this->id,
            'file_name' => $this->file_name,
            'file_type' => $this->file_type,
            'file_size' => $this->file_size,
            'file_size_formatted' => $this->getFileSizeFormatted(),
            'document_type' => $this->document_type,
            'document_type_label' => $this->getDocumentTypeLabel(),
            'description' => $this->description,
            'url' => $this->getFileUrl(),
            'is_image' => $this->isImage(),
            'is_pdf' => $this->isPdf(),
            'uploaded_by' => $this->uploadedBy ? [
                'id' => $this->uploadedBy->id,
                'name' => $this->uploadedBy->name,
            ] : null,
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
