<?php

use app\controller\TareaController;
use app\controller\ViewController;
use Webman\Route;

// --- Tareas ---

// Crear tarea
Route::post('/tareas', [TareaController::class, 'crearTarea']);

// Completar tarea
Route::post('/tareas/{id}/completar', [TareaController::class, 'completarTarea']);

// Actualizar tarea
Route::put('/tareas/{id}', [TareaController::class, 'modificarTarea']);
Route::patch('/tareas/{id}', [TareaController::class, 'modificarTarea']);

// Eliminar tarea
Route::delete('/tareas/{id}', [TareaController::class, 'borrarTarea']);

// Cambiar prioridad
Route::put('/tareas/{id}/prioridad', [TareaController::class, 'cambiarPrioridad']);

// Archivar / desarchivar
Route::post('/tareas/{id}/archivar', [TareaController::class, 'archivar']);

// Cambiar frecuencia de hábito
Route::put('/tareas/{id}/frecuencia', [TareaController::class, 'cambiarFrecuencia']);

// Asignar padre
Route::put('/tareas/{id}/padre', [TareaController::class, 'asignarPadre']);

// Asignar sección
Route::put('/tareas/{id}/seccion', [TareaController::class, 'asignarSeccion']);

// Guardar orden de tareas
Route::put('/tareas/orden', [TareaController::class, 'guardarOrden']);


// --- Secciones ---

// Ruta para renombrar una sección entera
Route::put('/secciones', [TareaController::class, 'renombrarSeccion']);


// --- Vista Principal ---
Route::get('/', [ViewController::class, 'index']);