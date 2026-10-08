<?php

use Illuminate\Support\Facades\Route;

// React Single Page Application Catch-all
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api).*$');
