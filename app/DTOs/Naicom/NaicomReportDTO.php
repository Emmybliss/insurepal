<?php

namespace App\DTOs\Naicom;

class NaicomReportDTO
{
    public function __construct(
        public readonly Form72ADTO $form72A,
        public readonly Form72BDTO $form72B,
        public readonly Form72CDTO $form72C,
    ) {}

    public function toArray(): array
    {
        return [
            'form_72a' => $this->form72A->toArray(),
            'form_72b' => $this->form72B->toArray(),
            'form_72c' => $this->form72C->toArray(),
        ];
    }
}
