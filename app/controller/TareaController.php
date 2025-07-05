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
        $seccion     = $request->post('seccion', null);
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
            'seccion'     => $seccion,
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
            'seccion'     => $request->post('seccion', $tarea->seccion),
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

    /**
     * Cambia la prioridad (importancia) de una tarea.
     * Ruta: PUT /tareas/{id}/prioridad
     */
    public function cambiarPrioridad(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        $nuevaPrioridad = $request->input('importancia');

        // Permitir tanto números (1-5) como textos (baja|media|alta)
        $valoresPermitidos = ['baja', 'media', 'alta', 1, 2, 3, 4, 5];
        if (!in_array($nuevaPrioridad, $valoresPermitidos, true)) {
            return Response::json([
                'success' => false,
                'error'   => 'Valor de prioridad no permitido.',
            ], 422);
        }

        $tarea->importancia = $nuevaPrioridad;
        $tarea->save();

        return Response::json([
            'success' => true,
            'data'    => $tarea,
        ]);
    }

    /**
     * Archiva o desarchiva una tarea y todas sus subtareas.
     * Ruta: POST /tareas/{id}/archivar
     */
    public function archivar(Request $request, int $id): Response
    {
        $tarea = Tarea::with('subtareas')->find($id);
        if (!$tarea) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        // Nuevo estado (toggle entre pendiente <-> archivado)
        $nuevoEstado = $tarea->estado === 'archivado' ? 'pendiente' : 'archivado';
        $this->aplicarEstadoRecursivo($tarea, $nuevoEstado);

        return Response::json([
            'success' => true,
            'data'    => [
                'mensaje' => 'Tarea y subtareas actualizadas.',
                'estado'  => $nuevoEstado,
            ],
        ]);
    }

    /**
     * Aplica un estado a la tarea y sus descendientes de forma recursiva.
     */
    private function aplicarEstadoRecursivo(Tarea $tarea, string $estado): void
    {
        $tarea->estado    = $estado;
        $tarea->archivado = $estado === 'archivado';
        $tarea->save();

        foreach ($tarea->subtareas as $sub) {
            $this->aplicarEstadoRecursivo($sub, $estado);
        }
    }

    /**
     * Cambia la frecuencia de un hábito.
     * Ruta: PUT /tareas/{id}/frecuencia
     */
    public function cambiarFrecuencia(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        if ($tarea->tipo !== 'habito' && $tarea->tipo !== 'habito flexible' && $tarea->tipo !== 'habito rigido') {
            return Response::json([
                'success' => false,
                'error'   => 'Solo se puede cambiar la frecuencia a tareas de tipo hábito.',
            ], 422);
        }

        $frecuencia = (int) $request->input('frecuencia', 0);
        if ($frecuencia <= 0) {
            return Response::json([
                'success' => false,
                'error'   => 'La frecuencia debe ser un número entero positivo.',
            ], 422);
        }

        $tarea->frecuencia   = $frecuencia;
        $hoy                 = date('Y-m-d');
        $tarea->fechaProxima = date('Y-m-d', strtotime("$hoy +$frecuencia days"));
        $tarea->save();

        return Response::json([
            'success' => true,
            'data'    => $tarea,
        ]);
    }

    /**
     * Reasigna el padre de una tarea, validando para evitar ciclos.
     * Ruta: PUT /tareas/{id}/padre
     */
    public function asignarPadre(Request $request, int $id): Response
    {
        $tareaHija = Tarea::find($id);
        if (!$tareaHija) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea hija no encontrada.',
            ], 404);
        }

        $padreId = (int) $request->input('padre_id', 0);
        if ($padreId === 0) {
            // Permitir quitar el padre estableciendo null
            $tareaHija->padre_id = null;
            $tareaHija->save();
            return Response::json([
                'success' => true,
                'data'    => $tareaHija,
            ]);
        }

        if ($padreId === $id) {
            return Response::json([
                'success' => false,
                'error'   => 'Una tarea no puede ser su propio padre.',
            ], 422);
        }

        $tareaPadre = Tarea::find($padreId);
        if (!$tareaPadre) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea padre no encontrada.',
            ], 404);
        }

        if ($this->creariaCiclo($tareaPadre, $tareaHija->id)) {
            return Response::json([
                'success' => false,
                'error'   => 'Asignar este padre crearía un ciclo en la jerarquía.',
            ], 422);
        }

        // Asignar nuevo padre y limpiar seccion si existía
        $tareaHija->padre_id = $padreId;
        $tareaHija->seccion  = null;
        $tareaHija->save();

        return Response::json([
            'success' => true,
            'data'    => $tareaHija,
        ]);
    }

    /**
     * Determina si asignar un padre crearía un ciclo.
     */
    private function creariaCiclo(Tarea $posiblePadre, int $idHija): bool
    {
        $actual = $posiblePadre;
        while ($actual) {
            if ($actual->id === $idHija) {
                return true;
            }
            $actual = $actual->padre;
        }
        return false;
    }

    /**
     * Asigna una tarea a una seccion específica.
     * Ruta: PUT /tareas/{id}/seccion
     */
    public function asignarSeccion(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return Response::json([
                'success' => false,
                'error'   => 'Tarea no encontrada.',
            ], 404);
        }

        $seccion = trim($request->input('seccion', ''));
        if ($seccion === '') {
            return Response::json([
                'success' => false,
                'error'   => 'La seccion es obligatoria.',
            ], 422);
        }

        // Si tenía padre, lo quitamos
        $tarea->padre_id = null;
        $tarea->seccion  = $seccion;
        $tarea->save();

        return Response::json([
            'success' => true,
            'data'    => $tarea,
        ]);
    }
} 