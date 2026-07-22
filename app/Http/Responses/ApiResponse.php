<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function respond(mixed $data, string $message = 'Success', int $code = 200, array $extra = []): JsonResponse
    {
        $response = [
            'data' => $data,
            'message' => $message,
        ];

        if (! empty($extra)) {
            $response = array_merge($response, $extra);
        }

        return response()->json($response, $code);
    }

    protected function respondCreated(mixed $data, string $message = 'Created successfully'): JsonResponse
    {
        return $this->respond($data, $message, 201);
    }

    protected function respondNoContent(string $message = 'Deleted successfully'): JsonResponse
    {
        return response()->json(['message' => $message], 200);
    }

    protected function respondError(string $message, int $code = 400, array $errors = []): JsonResponse
    {
        $response = ['message' => $message];

        if (! empty($errors)) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $code);
    }

    protected function respondNotFound(string $message = 'Resource not found'): JsonResponse
    {
        return $this->respondError($message, 404);
    }

    protected function respondForbidden(string $message = 'Forbidden'): JsonResponse
    {
        return $this->respondError($message, 403);
    }

    protected function respondUnauthenticated(string $message = 'Unauthenticated'): JsonResponse
    {
        return $this->respondError($message, 401);
    }

    protected function respondValidationError(string $message, array $errors): JsonResponse
    {
        return $this->respondError($message, 422, $errors);
    }
}
