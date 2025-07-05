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
        $titulo = trim($request->post('titulo', ''));
        if ($titulo === '') {
            return Response::json(['success' => false, 'error' => 'El título es obligatorio.'], 422);
        }

        $importancia = $request->post('importancia', 'media');
        $mapaImp = ['importante' => 4, 'alta' => 3, 'media' => 2, 'baja' => 1];

        $datos = [
            'titulo' => $titulo,
            'importancia' => $importancia,
            'impnum' => $mapaImp[$importancia] ?? 2,
            'tipo' => $request->post('tipo', 'una vez'),
            'estado' => $request->post('estado', 'pendiente'),
            'frecuencia' => (int) $request->post('frecuencia', 1),
            'seccion' => $request->post('seccion'),
            'padre_id' => ($padreId = (int)$request->post('padre', 0)) > 0 ? $padreId : null,
            'descripcion' => $request->post('descripcion'),
            'fecha' => date('Y-m-d'),
            'fecha_limite' => $request->post('fecha_limite'),
            'fecha_proxima' => null, // Se calcula al completar un hábito
            'archivado' => (bool) $request->post('archivado', false),
        ];

        $tarea = Tarea::create($datos);

        return Response::json([
            'success' => true,
            'data'    => ['tareaId' => $tarea->id,],
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
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }

        $titulo = trim($request->post('titulo', $tarea->titulo));
        if ($titulo === '') {
            return Response::json(['success' => false, 'error' => 'El título es obligatorio.'], 422);
        }

        $importancia = $request->post('importancia', $tarea->importancia);
        $mapaImp = ['importante' => 4, 'alta' => 3, 'media' => 2, 'baja' => 1];

        $tarea->fill([
            'titulo' => $titulo,
            'importancia' => $importancia,
            'impnum' => $mapaImp[$importancia] ?? $tarea->impnum,
            'tipo' => $request->post('tipo', $tarea->tipo),
            'estado' => $request->post('estado', $tarea->estado),
            'frecuencia' => (int) $request->post('frecuencia', $tarea->frecuencia),
            'seccion' => $request->post('seccion', $tarea->seccion),
            'descripcion' => $request->post('descripcion', $tarea->descripcion),
            'fecha' => $request->post('fecha', $tarea->fecha),
            'archivado' => (bool) $request->post('archivado', $tarea->archivado),
        ]);

        $tarea->save();

        return Response::json(['success' => true, 'data' => ['mensaje' => 'Tarea modificada.']]);
    }

    /**
     * Elimina una tarea.
     * Ruta: DELETE /tareas/{id}
     */
    public function borrarTarea(Request $request, int $id): Response
    {
        $tarea = Tarea::find($id);
        if (!$tarea) {
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }
        $tarea->delete();
        return Response::json(['success' => true, 'data' => ['mensaje' => 'Tarea borrada.']]);
    }

    /**
     * Marca una tarea (y opcionalmente sus subtareas) como completada.
     * Ruta: POST /tareas/{id}/completar
     */
    public function completarTarea(Request $request, int $id): Response
    {
        $tareaPrincipal = Tarea::find($id);
        if (!$tareaPrincipal) {
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }

        $this->procesarCompletado($tareaPrincipal);

        foreach ($tareaPrincipal->subtareas as $sub) {
            $this->procesarCompletado($sub);
        }

        return Response::json(['success' => true, 'data' => ['mensaje' => 'Tarea(s) procesada(s).']]);
    }

    /**
     * Lógica privada para marcar una tarea como completada o actualizar hábitos.
     */
    private function procesarCompletado(Tarea $tarea): void
    {
        $tipo = $tarea->tipo;

        if ($tipo === 'una vez' || $tipo === 'meta') {
            $tarea->estado = 'completada';
        } elseif (in_array($tipo, ['habito', 'habito flexible', 'habito rigido'])) {
            $frecuencia = $tarea->frecuencia > 0 ? $tarea->frecuencia : 1;
            $hoy = date('Y-m-d');

            $fechasCompletado = $tarea->fechas_completado ?? [];
            if (!in_array($hoy, $fechasCompletado)) {
                $fechasCompletado[] = $hoy;
            }

            $tarea->veces_completado = count($fechasCompletado);
            $tarea->fechas_completado = $fechasCompletado;
            $tarea->fecha = $hoy;
            $tarea->fecha_proxima = date('Y-m-d', strtotime("$hoy +$frecuencia days"));
        } else {
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
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }

        $nuevaPrioridad = $request->input('importancia');
        $valoresPermitidos = ['baja', 'media', 'alta', 'importante'];
        if (!in_array($nuevaPrioridad, $valoresPermitidos, true)) {
            return Response::json(['success' => false, 'error' => 'Valor de prioridad no permitido.'], 422);
        }

        $tarea->importancia = $nuevaPrioridad;
        $tarea->save(); // El accesor de impnum se encargará de actualizarlo en el modelo

        return Response::json(['success' => true, 'data' => $tarea]);
    }

    /**
     * Archiva o desarchiva una tarea y todas sus subtareas.
     * Ruta: POST /tareas/{id}/archivar
     */
    public function archivar(Request $request, int $id): Response
    {
        $tarea = Tarea::with('subtareas')->find($id);
        if (!$tarea) {
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }

        $nuevoEstado = $tarea->archivado ? 'pendiente' : 'archivado';
        $this->aplicarEstadoRecursivo($tarea, $nuevoEstado);

        return Response::json([
            'success' => true,
            'data' => ['mensaje' => 'Tarea y subtareas actualizadas.', 'estado' => $nuevoEstado],
        ]);
    }

    /**
     * Aplica un estado a la tarea y sus descendientes de forma recursiva.
     */
    private function aplicarEstadoRecursivo(Tarea $tarea, string $estado): void
    {
        $tarea->estado = $estado;
        $tarea->archivado = ($estado === 'archivado');
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
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }

        if (!in_array($tarea->tipo, ['habito', 'habito flexible', 'habito rigido'])) {
            return Response::json(['success' => false, 'error' => 'Solo se puede cambiar la frecuencia a tareas de tipo hábito.'], 422);
        }

        $frecuencia = (int) $request->input('frecuencia', 0);
        if ($frecuencia <= 0) {
            return Response::json(['success' => false, 'error' => 'La frecuencia debe ser un número entero positivo.'], 422);
        }

        $tarea->frecuencia = $frecuencia;
        // Opcional: Recalcular fecha_proxima basado en la última fecha completada o hoy
        $baseDate = $tarea->fecha ?? date('Y-m-d');
        $tarea->fecha_proxima = date('Y-m-d', strtotime("$baseDate +$frecuencia days"));
        $tarea->save();

        return Response::json(['success' => true, 'data' => $tarea]);
    }

    /**
     * Reasigna el padre de una tarea, validando para evitar ciclos.
     * Ruta: PUT /tareas/{id}/padre
     */
    public function asignarPadre(Request $request, int $id): Response
    {
        $tareaHija = Tarea::find($id);
        if (!$tareaHija) {
            return Response::json(['success' => false, 'error' => 'Tarea hija no encontrada.'], 404);
        }

        $padreId = (int) $request->input('padre_id', 0);
        if ($padreId === 0 || is_null($padreId)) {
            $tareaHija->padre_id = null;
            $tareaHija->save();
            return Response::json(['success' => true, 'data' => $tareaHija]);
        }

        if ($padreId === $id) {
            return Response::json(['success' => false, 'error' => 'Una tarea no puede ser su propio padre.'], 422);
        }

        $tareaPadre = Tarea::find($padreId);
        if (!$tareaPadre) {
            return Response::json(['success' => false, 'error' => 'Tarea padre no encontrada.'], 404);
        }

        if ($tareaPadre->padre_id !== null) {
            return Response::json(['success' => false, 'error' => 'No se permite anidar subtareas (máximo 1 nivel).'], 422);
        }

        if ($this->creariaCiclo($tareaPadre, $tareaHija->id)) {
            return Response::json(['success' => false, 'error' => 'Asignar este padre crearía un ciclo.'], 422);
        }

        $tareaHija->padre_id = $padreId;
        $tareaHija->seccion = null; // Una subtarea no pertenece a una sección, hereda la del padre
        $tareaHija->save();

        return Response::json(['success' => true, 'data' => $tareaHija]);
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
            return Response::json(['success' => false, 'error' => 'Tarea no encontrada.'], 404);
        }

        $seccion = trim($request->input('seccion', ''));
        if ($seccion === '') {
            return Response::json(['success' => false, 'error' => 'El nombre de la sección es obligatorio.'], 422);
        }

        $tarea->padre_id = null; // Si se asigna a una sección, deja de ser subtarea
        $tarea->seccion = $seccion;
        $tarea->save();

        return Response::json(['success' => true, 'data' => $tarea]);
    }

    /**
     * Renombra una sección para todas las tareas asociadas.
     * Ruta: PUT /secciones
     */
    public function renombrarSeccion(Request $request): Response
    {
        $nombreOriginal = $request->input('nombreOriginal');
        $nombreNuevo = trim($request->input('nombreNuevo', ''));

        if ($nombreNuevo === '') {
            return Response::json(['success' => false, 'error' => 'El nuevo nombre no puede estar vacío.'], 422);
        }
        if (strtolower($nombreNuevo) === 'general' || strtolower($nombreNuevo) === 'archivado') {
            return Response::json(['success' => false, 'error' => 'El nombre de la sección no puede ser "General" ni "Archivado".'], 422);
        }
        $existe = Tarea::where('seccion', $nombreNuevo)->where('seccion', '!=', $nombreOriginal)->exists();
        if ($existe) {
            return Response::json(['success' => false, 'error' => "La sección '$nombreNuevo' ya existe."], 409);
        }

        $numActualizadas = Tarea::where('seccion', $nombreOriginal)->update(['seccion' => $nombreNuevo]);

        return Response::json([
            'success' => true,
            'data'    => ['mensaje' => "Sección renombrada. $numActualizadas tareas actualizadas."],
        ]);
    }
}
