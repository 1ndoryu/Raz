<?php

namespace App\helpers;

use app\model\Tarea;

class TareaRenderer
{
    /**
     * Renderiza el componente de una sola tarea a HTML.
     *
     * @param Tarea $tarea La tarea a renderizar.
     * @return string HTML renderizado.
     */
    public static function renderizar(Tarea $tarea): string
    {
        // La función de renderizado recursivo, similar a la de ViewController.
        // Se define aquí para que esté encapsulada y disponible.
        $renderFunc = function (Tarea $task) use (&$renderFunc) {
            ob_start();
            // Para que 'componente.php' pueda acceder a $tarea y $renderTarea
            $tarea = $task;
            $renderTarea = $renderFunc;
            include(base_path('app/view/tareas/componente.php'));
            return ob_get_clean();
        };

        // Al renderizar una tarea nueva, no tiene 'children', por lo que la recursividad no se activará.
        // Asignamos una colección vacía para asegurar que la propiedad exista.
        if (!isset($tarea->children)) {
            $tarea->children = collect();
        }

        return $renderFunc($tarea);
    }
}
