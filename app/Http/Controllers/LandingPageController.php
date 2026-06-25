<?php

namespace App\Http\Controllers;

use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    /**
     * Display the landing page.
     */
    public function landingPage()
    {
        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('welcome', [
            'plans' => $plans,
        ]);
    }

    /**
     * Handle demo request form submission.
     */
    public function demoRequest(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $adminEmail = config('mail.from.address', 'support@insurepal.app');

        Mail::raw(
            "New InsurePal Demo Request\n\n".
            "Name: {$validated['name']}\n".
            "Email: {$validated['email']}\n".
            "Company: {$validated['company']}\n".
            'Phone: '.($validated['phone'] ?? 'Not provided')."\n",
            function ($message) use ($validated, $adminEmail) {
                $message->to($adminEmail)
                    ->subject("Demo Request — {$validated['company']}");
            }
        );

        return redirect()->route('home')->with('success', 'Your demo request has been sent! Our team will reach out shortly.');
    }

    /**
     * Display the Privacy Policy page.
     */
    public function privacyPolicy()
    {
        return Inertia::render('PrivacyPolicy');
    }

    /**
     * Display the Terms and Conditions page.
     */
    public function termsConditions()
    {
        return Inertia::render('TermsConditions');
    }
}
