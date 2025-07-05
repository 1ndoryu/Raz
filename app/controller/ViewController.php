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
        // Obtener todas las tareas agrupadas por sección (puede ser null)
        $tareasPorSeccion = Tarea::all()->groupBy('seccion');

        // Renderizar vista PHP sencilla (sin motor de plantillas)
        ob_start();
        // Disponibilizamos la variable en el ámbito de la vista
        $tareasPorSeccionLocal = $tareasPorSeccion;
        $tareasPorSeccion = $tareasPorSeccionLocal; // alias para la vista
        unset($tareasPorSeccionLocal);
        // Ruta absoluta del archivo de vista
        include dirname(__DIR__) . '/view/tareas/index.php';
        $html = ob_get_clean();

        return new Response(200, ['Content-Type' => 'text/html; charset=utf-8'], $html);
    }
} 