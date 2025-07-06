<?php

namespace App\services;

use app\model\Tarea;
use Exception;
use Illuminate\Database\Eloquent\Collection;

class TareaService
{
    /**
     * Crea una nueva tarea con los datos proporcionados.
     *
     * @param array $datos
     * @return Tarea
     * @throws Exception
     */
    public function crearTarea(array $datos): Tarea
    {
        if (empty(trim($datos['titulo'] ?? ''))) {
            throw new Exception('El título es obligatorio.', 422);
        }

        $mapaImp = ['importante' => 4, 'alta' => 3, 'media' => 2, 'baja' => 1];
        $importancia = $datos['importancia'] ?? 'media';
        $seccion = $datos['seccion'] ?? null;
        $padreId = isset($datos['padre_id']) && (int)$datos['padre_id'] > 0 ? (int)$datos['padre_id'] : null;

        $datosTarea = [
            'titulo' => trim($datos['titulo']),
            'importancia' => $importancia,
            'impnum' => $mapaImp[$importancia] ?? 2,
            'tipo' => $datos['tipo'] ?? 'una vez',
            'estado' => $datos['estado'] ?? 'pendiente',
            'frecuencia' => (int)($datos['frecuencia'] ?? 1),
            'seccion' => ($seccion === '' || strtolower($seccion) === 'general') ? null : $seccion,
            'padre_id' => $padreId,
            'descripcion' => $datos['descripcion'] ?? null,
            'fecha' => date('Y-m-d'),
            'fecha_limite' => !empty($datos['fecha_limite']) ? $datos['fecha_limite'] : null,
            'fecha_proxima' => null,
            'archivado' => (bool)($datos['archivado'] ?? false),
        ];

        $tarea = Tarea::create($datosTarea);

        if (!$tarea) {
            throw new Exception('No se pudo guardar la tarea en la base de datos.', 500);
        }

        return $tarea;
    }

    /**
     * Actualiza una tarea existente.
     *
     * @param Tarea $tarea
     * @param array $datos
     * @return Tarea
     * @throws Exception
     */
    public function actualizarTarea(Tarea $tarea, array $datos): Tarea
    {
        if (isset($datos['titulo']) && trim($datos['titulo']) === '') {
            throw new Exception('El título es obligatorio.', 422);
        }

        $mapaImp = ['importante' => 4, 'alta' => 3, 'media' => 2, 'baja' => 1];
        if (isset($datos['importancia'])) {
            $datos['impnum'] = $mapaImp[$datos['importancia']] ?? $tarea->impnum;
        }

        $tarea->fill($datos);
        $tarea->save();

        return $tarea;
    }

    /**
     * Elimina una tarea y sus descendientes.
     *
     * @param Tarea $tarea
     * @return void
     */
    public function eliminarTarea(Tarea $tarea): void
    {
        // La eliminación en cascada de la BD se encarga de las subtareas
        $tarea->delete();
    }

    /**
     * Procesa la finalización de una tarea (y sus subtareas).
     *
     * @param Tarea $tarea
     * @return void
     */
    public function completarTareaYSubtareas(Tarea $tarea): void
    {
        self::procesarCompletado($tarea);
        foreach ($tarea->subtareas as $sub) {
            self::procesarCompletado($sub);
        }
    }


    /**
     * Lógica para marcar una tarea como completada o actualizar hábitos.
     */
    public static function procesarCompletado(Tarea $tarea): void
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
     * Aplica un estado a la tarea y sus descendientes de forma recursiva.
     */
    public static function aplicarEstadoRecursivo(Tarea $tarea, string $estado): void
    {
        $tarea->estado = $estado;
        $tarea->archivado = ($estado === 'archivado');
        $tarea->save();

        foreach ($tarea->subtareas as $sub) {
            self::aplicarEstadoRecursivo($sub, $estado);
        }
    }

    /**
     * Asigna un nuevo padre a una tarea, realizando validaciones.
     *
     * @param Tarea $hija
     * @param int|null $padreId
     * @return Tarea
     * @throws Exception
     */
    public function asignarPadre(Tarea $hija, ?int $padreId): Tarea
    {
        if ($padreId === null || $padreId === 0) {
            $hija->padre_id = null;
            $hija->save();
            return $hija;
        }

        if ($padreId === $hija->id) {
            throw new Exception('Una tarea no puede ser su propio padre.', 422);
        }

        $padre = Tarea::find($padreId);
        if (!$padre) {
            throw new Exception('Tarea padre no encontrada.', 404);
        }

        if ($padre->padre_id !== null) {
            throw new Exception('No se permite anidar subtareas (máximo 1 nivel).', 422);
        }

        if (self::creariaCiclo($padre, $hija->id)) {
            throw new Exception('Asignar este padre crearía un ciclo.', 422);
        }

        $hija->padre_id = $padreId;
        $hija->seccion = null; // Una subtarea no pertenece a una sección directamente
        $hija->save();

        return $hija;
    }

    /**
     * Determina si asignar un padre crearía un ciclo.
     */
    public static function creariaCiclo(Tarea $posiblePadre, int $idHija): bool
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
     * Renombra una sección para todas las tareas asociadas.
     *
     * @param string $nombreOriginal
     * @param string $nombreNuevo
     * @return int
     * @throws Exception
     */
    public function renombrarSeccion(string $nombreOriginal, string $nombreNuevo): int
    {
        if (trim($nombreNuevo) === '') {
            throw new Exception('El nuevo nombre no puede estar vacío.', 422);
        }
        if (strtolower($nombreNuevo) === 'general' || strtolower($nombreNuevo) === 'archivado') {
            throw new Exception('El nombre de la sección no puede ser "General" ni "Archivado".', 422);
        }
        $existe = Tarea::where('seccion', $nombreNuevo)->where('seccion', '!=', $nombreOriginal)->exists();
        if ($existe) {
            throw new Exception("La sección '$nombreNuevo' ya existe.", 409);
        }

        return Tarea::where('seccion', $nombreOriginal)->update(['seccion' => $nombreNuevo]);
    }
}