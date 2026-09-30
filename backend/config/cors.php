<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000',
    ))),

    // Permite o Live Server na rede local apenas durante desenvolvimento.
    'allowed_origins_patterns' => env('APP_ENV', 'production') === 'local'
        ? ['#^http://192\\.168\\.\d{1,3}\\.\d{1,3}:5500$#']
        : [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'Idempotency-Key'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,
];
