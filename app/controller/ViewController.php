<?php

namespace app\controller;

use app\model\Tarea;
use support\Response;

class ViewController
{
    /**
     * Página principal de la aplicación.
     * Ruta: GET /
     */
    public function index(): Response
    {
        // 1. Obtener todas las tareas
        $allTasks = Tarea::all();

        // 2. Crear un mapa de tareas por ID para acceso rápido
        $tasksById = $allTasks->keyBy('id');

        // 3. Inicializar la propiedad 'children' en cada tarea como una colección vacía
        foreach ($tasksById as $task) {
            $task->children = collect();
        }

        // 4. Poblar la colección 'children' de cada padre, creando el árbol
        foreach ($tasksById as $task) {
            if ($task->padre_id && isset($tasksById[$task->padre_id])) {
                $tasksById[$task->padre_id]->children->push($task);
            }
        }

        // 5. Filtrar para obtener solo las tareas de nivel superior (raíces)
        $rootTasks = $allTasks->whereNull('padre_id');

        // 6. Agrupar las tareas raíz por sección
        $tareasPorSeccion = $rootTasks->groupBy('seccion');

        // 7. Renderizar la vista, pasando los datos y una función helper para recursividad
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
