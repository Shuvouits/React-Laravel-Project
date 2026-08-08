<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\OpenRouterService;
use Illuminate\Http\Request;
use Throwable;

class BrandAIController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GENERATE BRAND CONTENT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/ai/brand-content
    |
    */

    public function generate(
        Request $request,
        OpenRouterService $openRouter
    ) {
        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'description' => [
                    'nullable',
                    'string',
                    'max:500',
                ],

                'website' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],

            ]);


        try {

            /*
            |--------------------------------------------------------------------------
            | GENERATE
            |--------------------------------------------------------------------------
            */

            $content =
                $openRouter
                    ->generateBrandContent(
                        $validated
                    );


            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            return response()->json([

                'status' => true,

                'message' =>
                    'Brand content generated successfully.',

                'data' =>
                    $content,

            ]);

        } catch (Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    $error->getMessage()
                    ?: 'Unable to generate AI content.',

            ], 500);
        }
    }
}
