<?php
/** @var \Illuminate\Support\Collection|array $tareasPorSeccion */
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Raz - Lista de Tareas</title>
    <style>
        body{font-family:Arial, Helvetica, sans-serif;margin:0;padding:1rem;background:#f6f8fa}
        h1{margin-top:0}
        form{margin-bottom:1rem}
        ul{list-style:none;padding-left:1rem}
        li.tarea{padding:0.25rem 0;border-bottom:1px solid #ddd}
        .titulo{cursor:pointer}
        .archivado .titulo{text-decoration:line-through;color:#888}
        .btn-archivar{margin-left:.5rem;font-size:.8rem}
    </style>
</head>
<body>
<h1>Raz - Lista de Tareas</h1>

<form id="formCrearTarea">
    <input type="text" name="titulo" placeholder="Nueva tarea..." required>
    <button type="submit">Crear</button>
</form>

<div id="listaTareas">
<?php foreach ($tareasPorSeccion as $seccion => $tareas): ?>
    <h2><?= htmlspecialchars($seccion ?? 'General') ?></h2>
    <ul>
        <?php foreach ($tareas as $tarea): ?>
            <?php $t = $tarea; include __DIR__ . '/componente.php'; ?>
        <?php endforeach; ?>
    </ul>
<?php endforeach; ?>
</div>

<script src="/public/js/taskCRUD.js"></script>
<script src="/public/js/taskProperties.js"></script>
<script src="/public/js/taskArchive.js"></script>
</body>
</html> 