<?php
/**
 * @var \app\model\Tarea $tarea       La tarea a renderizar.
 * @var callable           $renderTarea La función para renderizar las subtareas.
 */

// Lógica para determinar clases y atributos, similar a TaskHelper.php
$esCompletada = $tarea->estado === 'completada';
$esArchivada = $tarea->archivado;
$esSubtarea = !is_null($tarea->padre_id);
$esPadre = $tarea->subtareas->isNotEmpty();

$clases = ['tarea', 'draggable-element'];
if ($esCompletada) $clases[] = 'completada';
if ($esArchivada) $clases[] = 'archivado';
if ($esSubtarea) $clases[] = 'subtarea';
if ($esPadre) $clases[] = 'tarea-padre';

?>
<li class="<?= implode(' ', $clases) ?>"
    data-tarea-id="<?= $tarea->id ?>"
    data-padre-id="<?= $tarea->padre_id ?? '' ?>"
    data-seccion="<?= htmlspecialchars($tarea->seccion ?? 'General') ?>"
    data-importancia="<?= htmlspecialchars($tarea->importancia) ?>"
    data-impnum="<?= $tarea->impnum ?>"
    data-tipo="<?= htmlspecialchars($tarea->tipo) ?>"
    data-estado="<?= htmlspecialchars($tarea->estado) ?>"
    data-fecha-limite="<?= $tarea->fecha_limite ?? '' ?>"
    data-fecha-proxima="<?= $tarea->fecha_proxima ?? '' ?>"
    draggable="true">

    <div class="tarea-contenido">
        <button class="btn-completar" title="Completar tarea">
            <span>&#9711;</span>
        </button>

        <span class="titulo" contenteditable="false"><?= htmlspecialchars($tarea->titulo) ?></span>
        
        <div class="acciones-hover">
            <button class="btn-archivar" title="Archivar">📥</button>
            <button class="btn-asignar-seccion" title="Asignar sección">📁</button>
            </div>
    </div>

    <?php if ($esPadre): ?>
        <ul class="subtareas-lista">
            <?php foreach ($tarea->children as $child): ?>
                <?php $renderTarea($child); // Llamada recursiva ?>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</li>