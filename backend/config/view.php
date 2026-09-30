<?php

$compiledPath = env(
    'VIEW_COMPILED_PATH',
    sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'vibe-views',
);

if (! is_dir($compiledPath)) {
    @mkdir($compiledPath, 0775, true);
}

return [
    'paths' => [
        resource_path('views'),
    ],

    'compiled' => $compiledPath,

    'relative_hash' => false,
    'cache' => true,
    'compiled_extension' => 'php',
    'check_cache_timestamps' => true,
];
