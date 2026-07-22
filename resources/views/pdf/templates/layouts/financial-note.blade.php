@extends('pdf.layouts.master')

@section('title')
    @yield('title', 'Document')
@endsection

@section('content')
    @yield('content')
    
    @hasSection('signature')
        <div class="avoid-break mt-6">
            @yield('signature')
        </div>
    @endif
@endsection