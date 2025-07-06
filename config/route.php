<?php

use app\controller\TareaController;
use app\controller\ViewController;
use Webman\Route;

// --- Tareas ---

// Crear tarea
Route::post('/tareas', [TareaController::class, 'crearTarea']);

// Completar tarea
Route::post('/tareas/{id}/completar', [TareaController::class, 'completarTarea']);

// Archivar / desarchivar
Route::post('/tareas/{id}/archivar', [TareaController::class, 'archivar']);

// Marcar un día específico de un hábito (completado, saltado, pendiente)
Route::post('/tareas/{id}/marcar-dia', [TareaController::class, 'marcarDiaHabito']);

// Guardar orden de tareas
// ¡CORREGIDO! Ruta estática movida ANTES de la ruta variable para evitar conflictos.
Route::put('/tareas/orden', [TareaController::class, 'guardarOrden']);

// Actualizar tarea
Route::put('/tareas/{id}', [TareaController::class, 'modificarTarea']);
Route::patch('/tareas/{id}', [TareaController::class, 'modificarTarea']);

// Eliminar tarea
Route::delete('/tareas/{id}', [TareaController::class, 'borrarTarea']);

// Cambiar prioridad
Route::put('/tareas/{id}/prioridad', [TareaController::class, 'cambiarPrioridad']);

// Cambiar frecuencia de hábito
Route::put('/tareas/{id}/frecuencia', [TareaController::class, 'cambiarFrecuencia']);

// Asignar padre
Route::put('/tareas/{id}/padre', [TareaController::class, 'asignarPadre']);

// Asignar sección
Route::put('/tareas/{id}/seccion', [TareaController::class, 'asignarSeccion']);


// --- Secciones ---

// Ruta para renombrar una sección entera
Route::put('/secciones', [TareaController::class, 'renombrarSeccion']);


// --- Vista Principal ---
Route::get('/', [ViewController::class, 'index']);