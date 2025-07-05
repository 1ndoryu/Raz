<?php

namespace app\controller;

use app\model\Tarea;
use support\Request;
use support\Response;

class TareaController
{
    /**
     * Crea una nueva tarea.
     * Ruta: POST /tareas
     */
    public function crearTarea(Request $request): Response
    {
        // Validaciones básicas
        $titulo = trim($request->post('titulo', ''));
        if ($titulo === '') {
            return Response::json([
                'success' => false,
                'error'   => 'El título es obligatorio.',
            ], 422);
        }

        // Campos opcionales con valores por defecto
        $importancia = $request->post('importancia', 'media');
        $tipo        = $request->post('tipo', 'una vez');
        $estado      = $request->post('estado', 'pendiente');
        $frecuencia  = (int) $request->post('frecuencia', 1);
        $sesion      = $request->post('sesion', null);
        $padreId     = (int) $request->post('padre', 0);
        $descripcion = $request->post('descripcion', null);
        $fecha       = $request->post('fecha', date('Y-m-d'));
        $archivado   = (bool) $request->post('archivado', false);

        // Construir array de datos
        $datos = [
            'titulo'      => $titulo,
            'importancia' => $importancia,
            'tipo'        => $tipo,
            'estado'      => $estado,
            'frecuencia'  => $frecuencia,
            'sesion'      => $sesion,
            'padre_id'    => $padreId > 0 ? $padreId : null,
            'descripcion' => $descripcion,
            'fecha'       => $fecha,
            'archivado'   => $archivado,
        ];

        // Insertar en base de datos
        $tarea = Tarea::create($datos);

        return Response::json([
            'success' => true,
            'data'    => [
                'tareaId' => $tarea->id,
            ],
        ]);
    }

    /**
     * Actualiza el título u otros campos de una tarea existente.
     * Ruta: PUT /tareas/{id}
     */
    public function modificarTarea(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        $titulo = trim($request->post('titulo', $tarea->titulo));
        if ($titulo === '') {
            return Response::json([
                'success' => false,
                'error'   => 'El título es obligatorio.',
            ], 422);
        }

        // Actualizar campos permitidos
        $tarea->fill([
            'titulo'      => $titulo,
            'importancia' => $request->post('importancia', $tarea->importancia),
            'tipo'        => $request->post('tipo', $tarea->tipo),
            'estado'      => $request->post('estado', $tarea->estado),
            'frecuencia'  => (int) $request->post('frecuencia', $tarea->frecuencia),
            'sesion'      => $request->post('sesion', $tarea->sesion),
            'descripcion' => $request->post('descripcion', $tarea->descripcion),
            'fecha'       => $request->post('fecha', $tarea->fecha),
            'archivado'   => (bool) $request->post('archivado', $tarea->archivado),
        ]);

        $tarea->save();

        return Response::json([
            'success' => true,
            'data'    => ['mensaje' => 'Tarea modificada.'],
        ]);
    }

    /**
     * Elimina una tarea.
     * Ruta: DELETE /tareas/{id}
     */
    public function borrarTarea(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        $tarea->delete();

        return Response::json([
            'success' => true,
            'data'    => ['mensaje' => 'Tarea borrada.'],
        ]);
    }

    /**
     * Marca una tarea (y opcionalmente sus subtareas) como completada.
     * Ruta: POST /tareas/{id}/completar
     */
    public function completarTarea(Request $request, int $id): Response
    {
        $tareaPrincipal = Tarea::find($id);
        if (!$tareaPrincipal) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        // Procesar tarea principal
        $this->procesarCompletado($tareaPrincipal);

        // Procesar subtareas, si existen
        foreach ($tareaPrincipal->subtareas as $sub) {
            $this->procesarCompletado($sub);
        }

        return Response::json([
            'success' => true,
            'data'    => ['mensaje' => 'Tarea(s) procesada(s).'],
        ]);
    }

    /**
     * Lógica privada para marcar una tarea como completada o actualizar hábitos.
     */
    private function procesarCompletado(Tarea $tarea): void
    {
        $tipo = $tarea->tipo;

        if ($tipo === 'una vez' || $tipo === 'meta') {
            $tarea->estado = 'completada';
        } elseif ($tipo === 'habito' || $tipo === 'habito flexible' || $tipo === 'habito rigido') {
            $frecuencia = (int) ($tarea->frecuencia ?? 1);
            if ($frecuencia <= 0) {
                $frecuencia = 1;
            }

            // Manejar contadores y fechas
            $tarea->vecesCompletado = ($tarea->vecesCompletado ?? 0) + 1;
            $hoy                   = date('Y-m-d');
            $tarea->fecha          = $hoy;
            $tarea->fechaProxima   = date('Y-m-d', strtotime("$hoy +$frecuencia days"));
        } else {
            // Por defecto marcar como completada
            $tarea->estado = 'completada';
        }

        $tarea->save();
    }
} 