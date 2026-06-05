<?php

namespace App\Support;

use Illuminate\Support\Arr;
use InvalidArgumentException;

class ModuleRegistry
{
    public function all(): array
    {
        return config('platform.modules', []);
    }

    public function builders(): array
    {
        return config('platform.builders', []);
    }

    public function resolve(string $module): array
    {
        $definition = Arr::get($this->all(), $module);

        if (! $definition) {
            throw new InvalidArgumentException("Unknown module [{$module}]");
        }

        return $definition;
    }
}
