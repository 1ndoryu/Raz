<?php

/**
 * @var \app\model\Tarea $tarea  La tarea a renderizar.
 * @var callable     $renderTarea La función para renderizar las subtareas.
 */

// Lógica para determinar clases y atributos, similar al "Proyecto viejo/code/TaskHelper.php"
$esCompletada = $tarea->estado === 'completada';
$esArchivada = $tarea->archivado;
$esSubtarea = !is_null($tarea->padre_id);
// Una tarea es padre si su colección de subtareas (children, poblada en el controller) no está vacía.
$esPadre = isset($tarea->children) && $tarea->children->isNotEmpty();
$esHabito = in_array($tarea->tipo, ['habito', 'habito flexible', 'habito rigido']);

$clases = ['tarea', 'draggable-element'];
if ($esCompletada) $clases[] = 'completada';
if ($esArchivada) $clases[] = 'archivado';
if ($esSubtarea) $clases[] = 'subtarea';
if ($esPadre) $clases[] = 'tarea-padre';

// Determinar la sección a la que pertenece visualmente.
// Una subtarea pertenece a la sección de su padre. El controlador ya no la asigna.
$seccionVisual = htmlspecialchars($tarea->seccion ?: 'General');
if ($esSubtarea && $tarea->padre) {
    // Si la subtarea tiene su padre cargado, usamos la sección del padre.
    $seccionVisual = htmlspecialchars($tarea->padre->seccion ?: 'General');
}

?>
<li class="<?= implode(' ', $clases) ?>"
    data-tarea-id="<?= $tarea->id ?>"
    data-padre-id="<?= $tarea->padre_id ?? '' ?>"
    data-seccion="<?= $seccionVisual ?>"
    data-importancia="<?= htmlspecialchars($tarea->importancia) ?>"
    data-impnum="<?= $tarea->impnum ?>"
    data-tipo="<?= htmlspecialchars($tarea->tipo) ?>"
    data-estado="<?= htmlspecialchars($tarea->estado) ?>"
    data-fecha-limite="<?= $tarea->fecha_limite ?? '' ?>"
    data-fecha-proxima="<?= $tarea->fecha_proxima ?? '' ?>"
    draggable="true">

    <div class="tarea-contenido">
        <button class="btn-completar" title="Completar tarea">
            <span></span>
        </button>

        <span class="titulo" contenteditable="false"><?= htmlspecialchars($tarea->titulo) ?></span>

        <?php if ($esHabito) : ?>
            <div class="habito-dias-visualizacion">
                <?php
                // Lógica replicada de TaskHelper.php para mostrar los últimos 5 días
                $maxDiasMostrar = 5;
                $hoy = new DateTime();
                $diasParaMostrar = [];

                for ($i = 0; $i < $maxDiasMostrar; $i++) {
                    $fechaDia = (clone $hoy)->modify("-$i days")->format('Y-m-d');
                    $diasParaMostrar[] = $fechaDia;
                }
                $diasParaMostrar = array_reverse($diasParaMostrar); // Para mostrar de más antiguo a más reciente

                $fechasCompletado = $tarea->fechas_completado ?? [];
                $fechasSaltado = $tarea->fechas_saltado ?? [];

                foreach ($diasParaMostrar as $fechaDia) {
                    $estadoDia = 'pendiente';
                    $claseEstado = 'estado-pendiente';

                    if (in_array($fechaDia, $fechasCompletado)) {
                        $estadoDia = 'completado';
                        $claseEstado = 'estado-completado';
                    } elseif (in_array($fechaDia, $fechasSaltado)) {
                        $estadoDia = 'saltado';
                        $claseEstado = 'estado-saltado';
                    }

                    echo '<span class="dia-habito-item ' . $claseEstado . '" data-fecha="' . $fechaDia . '" data-estado="' . $estadoDia . '" title="' . $fechaDia . '"></span>';
                }
                ?>
            </div>
        <?php endif; ?>

        <div class="acciones-hover">
            <button class="btn-cambiar-prioridad" title="Cambiar prioridad">⭐</button>
            <button class="btn-gestionar-fechas" title="Gestionar fechas">🗓️</button>
            <?php if ($esHabito): ?>
                <button class="btn-cambiar-frecuencia" title="Cambiar frecuencia">🔁</button>
            <?php endif; ?>
            <button class="btn-archivar" title="Archivar">📥</button>
            <button class="btn-asignar-seccion" title="Asignar sección">📁</button>
            <button class="btn-borrar-tarea" title="Borrar tarea">🗑️</button>
        </div>
    </div>

    <?php if ($esPadre): ?>
        <ul class="subtareas-lista">
            <?php foreach ($tarea->children as $child): ?>
                <?php $renderTarea($child); // Llamada recursiva 
                ?>
            <?php endforeach; ?>
        </ul>
    <?php endif; ?>
</li>