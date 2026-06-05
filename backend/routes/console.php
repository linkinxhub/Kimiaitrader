<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('platform:ping', function (): void {
    $this->info('Premium Platform backend is ready.');
});
