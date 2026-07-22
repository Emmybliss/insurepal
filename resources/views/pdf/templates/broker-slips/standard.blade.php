@extends('pdf.templates.layouts.financial-note')

@section('title', 'Broker Slip - ' . ($slip->slip_number ?? ''))

@section('content')
    @include('pdf.templates.broker-slips.partials.header')

    @include('pdf.templates.broker-slips.partials.details')

    @include('pdf.templates.broker-slips.partials.risk-schedule')

    @include('pdf.templates.broker-slips.partials.financial-summary')

    @include('pdf.templates.broker-slips.partials.clauses')

    @include('pdf.templates.broker-slips.partials.signatures')
@endsection
