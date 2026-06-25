<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;

trait DeletesStorageFiles
{
    /**
     * Boot the trait to hook into the deleting event.
     */
    public static function bootDeletesStorageFiles()
    {
        static::deleting(function ($model) {
            // Check if the model uses soft deletes and if it is being force deleted
            // If it uses soft deletes and is not being force deleted, we skip file deletion
            if (in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, class_uses($model))) {
                if (! $model->isForceDeleting()) {
                    return;
                }
            }

            $disk = method_exists($model, 'storageDisk') ? $model->storageDisk() : 'public';

            if (method_exists($model, 'fileAttributes')) {
                foreach ($model->fileAttributes() as $attribute) {
                    $value = $model->{$attribute};
                    if (empty($value)) {
                        continue;
                    }

                    $files = is_array($value) ? $value : [$value];

                    foreach ($files as $file) {
                        if (is_string($file) && ! empty($file)) {
                            if (Storage::disk($disk)->exists($file)) {
                                Storage::disk($disk)->delete($file);
                            }
                        }
                    }
                }
            }
        });
    }
}
