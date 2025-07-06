<?php

namespace app\controller;

use app\model\Tarea;
use App\services\TareaService;
use App\helpers\TareaRenderer;
use support\Request;
use support\Response;
use Exception;
use Throwable;

class TareaController
{
    private TareaService $tareaService;

    public function __construct()
    {
        $this->tareaService = new TareaService();
    }

    /**
     * Crea una nueva tarea.
     * Ruta: POST /tareas
     */
    public function crearTarea(Request $request): Response
    {
        try {
            $tarea = $this->tareaService->crearTarea($request->post());
            $html = TareaRenderer::renderizar($tarea);

            if (empty(trim($html))) {
                error_log("[TareaController] TareaRenderer::renderizar devolvió HTML vacío para la tarea ID: " . $tarea->id);
                return new Response(500, ['Content-Type' => 'application/json'], json_encode([
                    'success' => false,
                    'error' => 'Error del servidor: no se pudo generar el HTML para la nueva tarea.'
                ]));
            }

            return new Response(201, ['Content-Type' => 'application/json'], json_encode([
                'success' => true,
                'data'  => [
                    'id' => $tarea->id,
                    'html' => $html,
                ],
            ]));
        } catch (Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return new Response($codigo, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => $e->getMessage()]));
        } catch (Throwable $th) {
            error_log("Error al crear tarea: " . $th->getMessage());
            return new Response(500, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => 'Error interno del servidor al crear la tarea.']));
        }
    }

    /**
     * Actualiza una tarea existente.
     * Ruta: PUT /tareas/{id}
     */
    public function modificarTarea(Request $request, int $id): Response
    {
        try {
            $tarea = Tarea::find($id);
            if (!$tarea) {
                return new Response(404, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => 'Tarea no encontrada.']));
            }

            $this->tareaService->actualizarTarea($tarea, $request->post());
            return new Response(200, ['Content-Type' => 'application/json'], json_encode(['success' => true, 'data' => ['mensaje' => 'Tarea modificada.']]));
        } catch (Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return new Response($codigo, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => $e->getMessage()]));
        }
    }

    /**
     * Elimina una tarea.
     * Ruta: DELETE /tareas/{id}
     */
    public function borrarTarea(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return new Response(404, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => 'Tarea no encontrada.']));
        }
        $this->tareaService->eliminarTarea($tarea);
        return new Response(204);
    }

    /**
     * Marca una tarea (y opcionalmente sus subtareas) como completada.
     * Ruta: POST /tareas/{id}/completar
     */
    public function completarTarea(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return new Response(404, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => 'Tarea no encontrada.']));
        }
        $this->tareaService->completarTareaYSubtareas($tarea);
        return new Response(200, ['Content-Type' => 'application/json'], json_encode(['success' => true, 'data' => ['mensaje' => 'Tarea(s) procesada(s).']]));
    }

    /**
     * Archiva o desarchiva una tarea y todas sus subtareas.
     * Ruta: POST /tareas/{id}/archivar
     */
    public function archivar(Request $request, int $id): Response
    {
        $tarea = Tarea::with('subtareas')->find($id);
        if (!$tarea) {
            return new Response(404, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => 'Tarea no encontrada.']));
        }
        $nuevoEstado = $tarea->archivado ? 'pendiente' : 'archivado';
        TareaService::aplicarEstadoRecursivo($tarea, $nuevoEstado);

        return new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'success' => true,
            'data' => ['mensaje' => 'Tarea y subtareas actualizadas.', 'estado' => $nuevoEstado],
        ]));
    }

    /**
     * Asigna el padre de una tarea.
     * Ruta: PUT /tareas/{id}/padre
     */
    public function asignarPadre(Request $request, int $id): Response
    {
        try {
            $tareaHija = Tarea::find($id);
            if (!$tareaHija) {
                return new Response(404, [], json_encode(['success' => false, 'error' => 'Tarea hija no encontrada.']));
            }
            $padreId = $request->input('padre_id');
            $tareaActualizada = $this->tareaService->asignarPadre($tareaHija, $padreId ? (int)$padreId : null);
            return new Response(200, ['Content-Type' => 'application/json'], json_encode(['success' => true, 'data' => $tareaActualizada]));
        } catch (Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return new Response($codigo, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => $e->getMessage()]));
        }
    }

    /**
     * Asigna una tarea a una seccion específica.
     * Ruta: PUT /tareas/{id}/seccion
     */
    public function asignarSeccion(Request $request, int $id): Response
    {
        try {
            $tarea = Tarea::find($id);
            if (!$tarea) {
                return new Response(404, [], json_encode(['success' => false, 'error' => 'Tarea no encontrada.']));
            }

            $seccion = $request->input('seccion');
            if (empty(trim($seccion))) {
                return new Response(422, [], json_encode(['success' => false, 'error' => 'El nombre de la sección es obligatorio.']));
            }

            $tarea->padre_id = null;
            $tarea->seccion = $seccion;
            $tarea->save();

            return new Response(200, ['Content-Type' => 'application/json'], json_encode(['success' => true, 'data' => $tarea]));
        } catch (Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return new Response($codigo, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => $e->getMessage()]));
        }
    }


    /**
     * Renombra una sección para todas las tareas asociadas.
     * Ruta: PUT /secciones
     */
    public function renombrarSeccion(Request $request): Response
    {
        try {
            $nombreOriginal = $request->input('nombreOriginal');
            $nombreNuevo = $request->input('nombreNuevo');
            $numActualizadas = $this->tareaService->renombrarSeccion($nombreOriginal, $nombreNuevo);

            return new Response(200, ['Content-Type' => 'application/json'], json_encode([
                'success' => true,
                'data'  => ['mensaje' => "Sección renombrada. $numActualizadas tareas actualizadas."],
            ]));
        } catch (Exception $e) {
            $codigo = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return new Response($codigo, ['Content-Type' => 'application/json'], json_encode(['success' => false, 'error' => $e->getMessage()]));
        }
    }

    // Los métodos para cambiar propiedades específicas como prioridad y frecuencia
    // podrían quedarse aquí o moverse a un `TareaPropiedadController` si crece más.
    // Por ahora, se dejan aquí por simplicidad pero podrían usar el servicio también.
    public function cambiarPrioridad(Request $request, int $id): Response
    {
        // ... (sin cambios, pero podría usar TareaService) ...
        return new Response(501, [], json_encode(['success' => false, 'error' => 'Not implemented yet after refactor.']));
    }

    public function cambiarFrecuencia(Request $request, int $id): Response
    {
        // ... (sin cambios, pero podría usar TareaService) ...
        return new Response(501, [], json_encode(['success' => false, 'error' => 'Not implemented yet after refactor.']));
    }
}
