<?php
/** @var \Illuminate\Support\Collection|array $tareasPorSeccion */
/** @var callable $renderTarea */
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Raz - Lista de Tareas</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 1rem; background: #f6f8fa; color: #333; }
        h1, h2 { color: #111; }
        ul { list-style: none; padding-left: 0; margin: 0; }

        /* Formulario de creación */
        #formCrearTarea { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 8px; background: #fff; margin-bottom: 1rem; }
        #formCrearTarea input[name="titulo"] { flex-grow: 1; border: none; outline: none; font-size: 1rem; }
        #formCrearTarea button { background: #007bff; color: white; border: none; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
        #formCrearTarea button:hover { background: #0056b3; }
        
        /* Tareas */
        .tarea { padding: 8px 12px; border-bottom: 1px solid #e1e4e8; display: flex; flex-direction: column; }
        .tarea.dragging { opacity: 0.5; background: #d6eaff; }
        .tarea.drop-target > .tarea-contenido { background-color: #e0f0ff; border-radius: 4px; }
        .tarea-contenido { display: flex; align-items: center; width: 100%; }
        
        .btn-completar { background: none; border: 1px solid #ccc; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; margin-right: 12px; padding: 0; display: flex; align-items: center; justify-content: center; }
        .tarea.completada .btn-completar { background: #28a745; border-color: #28a745; color: white; }
        .tarea.completada .btn-completar span { content: '✓'; }

        .titulo { flex-grow: 1; cursor: pointer; }
        .tarea.completada .titulo { text-decoration: line-through; color: #888; }
        .tarea.archivado { opacity: 0.6; }
        .tarea.archivado .titulo { text-decoration: line-through; }

        .acciones-hover { display: none; margin-left: auto; }
        .tarea:hover .acciones-hover { display: flex; gap: 8px; }
        .acciones-hover button { background: none; border: none; cursor: pointer; font-size: 1rem; }

        /* Jerarquía */
        .subtareas-lista { padding-left: 32px; /* Espacio para el botón de completar e indentación */ border-left: 1px dashed #ccc; margin-left: 10px; margin-top: 5px; }
        .subtarea { background-color: #fafbfc; }

    </style>
</head>
<body>
    <h1>Raz - Lista de Tareas</h1>

    <form id="formCrearTarea">
        <input type="text" name="titulo" placeholder="Añadir nueva tarea..." required>
        <button type="submit">Crear</button>
    </form>

    <div id="listaTareas">
        <?php foreach ($tareasPorSeccion as $seccion => $tareas) : ?>
            <div class="seccion-container" data-seccion-nombre="<?= htmlspecialchars($seccion ?: 'General') ?>">
                <h2><?= htmlspecialchars($seccion ?: 'General') ?></h2>
                <ul class="tareas-lista">
                    <?php foreach ($tareas as $tarea) : ?>
                        <?php $renderTarea($tarea); // Llamar a la función de renderizado recursiva ?>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endforeach; ?>
    </div>

    <script src="/js/taskCRUD.js"></script>
    <script src="/js/taskArchive.js"></script>
    <script src="/js/taskHierarchy.js"></script>
    <script src="/js/taskSections.js"></script>
</body>
</html>