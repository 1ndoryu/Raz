<?php

namespace app\controller;

use app\model\Setting;
use app\model\Tarea;
use Illuminate\Database\Capsule\Manager as DB;
use support\Response;

class ViewController
{
    /**
     * Página principal de la aplicación.
     * Ruta: GET /
     */
    public function index(): Response
    {
        // 1. Obtener el orden guardado y sanearlo
        $savedOrder = Setting::find('task_order')?->value ?? [];
        $allTaskIds = Tarea::pluck('id')->all();

        $validOrderedIds = array_intersect($savedOrder, $allTaskIds);
        $newUnorderedIds = array_diff($allTaskIds, $validOrderedIds);
        $finalOrderIds = array_merge($validOrderedIds, $newUnorderedIds);

        // Si el orden cambió (por tareas nuevas o eliminadas), lo guardamos.
        if (count($finalOrderIds) !== count($savedOrder) || !empty(array_diff($finalOrderIds, $savedOrder))) {
            Setting::updateOrCreate(['key' => 'task_order'], ['value' => $finalOrderIds]);
        }

        // 2. Obtener todas las tareas en el orden final.
        $allTasks = collect();
        if (!empty($finalOrderIds)) {
            $allTasks = Tarea::whereIn('id', $finalOrderIds)
                ->orderByRaw(DB::raw('array_position(array[' . implode(',', $finalOrderIds) . '], id)'))
                ->get();
        }

        // 3. Crear un mapa de tareas por ID para acceso rápido
        $tasksById = $allTasks->keyBy('id');

        // 4. Inicializar la propiedad 'children' en cada tarea como una colección vacía
        foreach ($tasksById as $task) {
            $task->children = collect();
        }

        // 5. Poblar la colección 'children' de cada padre, creando el árbol
        foreach ($tasksById as $task) {
            if ($task->padre_id && isset($tasksById[$task->padre_id])) {
                $tasksById[$task->padre_id]->children->push($task);
            }
        }

        // 6. Filtrar para obtener solo las tareas de nivel superior (raíces)
        // Usamos el orden ya establecido por la query
        $rootTasks = $allTasks->whereNull('padre_id');

        // 7. Agrupar las tareas raíz por sección, tratando las archivadas por separado.
        $tareasPorSeccion = $rootTasks->groupBy(function ($tarea) {
            if ($tarea->archivado) {
                return 'Archivado';
            }
            return $tarea->seccion ?: 'General';
        });

        // 8. Ordenar las secciones: General primero, el resto alfabéticamente, y Archivado al final.
        $tareasPorSeccion = $tareasPorSeccion->sortBy(function ($tareas, $seccion) {
            if ($seccion === 'General') return -2;
            if ($seccion === 'Archivado') return 2;
            return strtolower($seccion);
        }, SORT_NATURAL);


        // 9. Renderizar la vista, pasando los datos y una función helper para recursividad
        ob_start();

        // Hago disponible una función para renderizar una tarea, para poder llamarla recursivamente desde las vistas.
        $renderTarea = function ($tarea) use (&$renderTarea) {
            // La variable $tarea está disponible dentro del scope del componente
            include(dirname(__DIR__) . '/view/tareas/componente.php');
        };

        // Paso las variables a la vista
        $viewData = [
            'tareasPorSeccion' => $tareasPorSeccion,
            'renderTarea' => $renderTarea
        ];
        extract($viewData); // Extraer variables para que estén disponibles en el scope de index.php
        include dirname(__DIR__) . '/view/tareas/index.php';
        $html = ob_get_clean();

        return new Response(200, ['Content-Type' => 'text/html; charset=utf-8'], $html);
    }
}