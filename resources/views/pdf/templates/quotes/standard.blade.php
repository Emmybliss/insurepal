@extends('pdf.templates.layouts.financial-note')

@section('title', 'Customer Insurance Quote - ' . ($quote->quote_number ?? ''))

@section('content')
    @include('pdf.templates.quotes.partials.header')

    @include('pdf.templates.quotes.partials.details')

    @include('pdf.templates.quotes.partials.risk-schedule')

    @include('pdf.templates.quotes.partials.financial-summary')

    @include('pdf.templates.quotes.partials.clauses')
@endsection
