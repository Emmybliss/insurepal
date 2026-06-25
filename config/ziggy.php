<?php

return [
    'only' => [], // Include all routes
    'except' => [], // Exclude no routes
    'groups' => [
        'admin' => ['admin.*'],
        'tenant' => ['customers.*', 'quotes.*', 'policies.*', 'messages.*', 'financial-notes.*', 'reports.*'],
    ],
];
