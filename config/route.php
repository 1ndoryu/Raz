<?php

use app\controller\TareaController;
use Webman\Route;

Route::group('/tareas', function () {
    // Crear tarea
    Route::post('/', [TareaController::class, 'crearTarea']);

    // Completar tarea (antes que PUT/PATCH para evitar conflicto de {id})
    Route::post('/{id}/completar', [TareaController::class, 'completarTarea']);

    // Actualizar tarea
    Route::put('/{id}', [TareaController::class, 'modificarTarea']);
    Route::patch('/{id}', [TareaController::class, 'modificarTarea']);

    // Eliminar tarea
    Route::delete('/{id}', [TareaController::class, 'borrarTarea']);
});






