<?php

use app\controller\TareaController;
use app\controller\ViewController;
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

    // Cambiar prioridad
    Route::put('/{id}/prioridad', [TareaController::class, 'cambiarPrioridad']);

    // Archivar / desarchivar
    Route::post('/{id}/archivar', [TareaController::class, 'archivar']);

    // Cambiar frecuencia de hábito
    Route::put('/{id}/frecuencia', [TareaController::class, 'cambiarFrecuencia']);

    // Asignar padre
    Route::put('/{id}/padre', [TareaController::class, 'asignarPadre']);

    // Asignar sección
    Route::put('/{id}/seccion', [TareaController::class, 'asignarSeccion']);
});

// Ruta para renombrar una sección entera
Route::put('/secciones', [TareaController::class, 'renombrarSeccion']);

Route::get('/', [ViewController::class, 'index']);