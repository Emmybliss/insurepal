<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $products = $request->tenant->products()
            ->active()
            ->ordered()
            ->with(['policyType', 'policyClass'])
            ->get();

        return response()->json($products);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $product = $request->tenant->products()
            ->active()
            ->with(['policyType', 'policyClass'])
            ->findOrFail($id);

        return response()->json($product);
    }
}
