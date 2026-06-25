import { FormDataConvertible } from '@inertiajs/core';
import { useForm } from '@inertiajs/react';

export function useFormAction<TForm extends Record<string, FormDataConvertible>>(initialValues: TForm) {
    const form = useForm(initialValues);

    return {
        form,
        ...form,
    };
}

export type UseFormActionReturn<TForm extends Record<string, FormDataConvertible>> = ReturnType<typeof useFormAction<TForm>>;
