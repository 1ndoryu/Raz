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
    </style>
</head>

<body>
        <h1>Raz - Lista de Tareas</h1>

        <form id="formCrearTarea" autocomplete="off">
                <input type="text" name="titulo" placeholder="Añadir nueva tarea...">

                <div class="form-selector" id="sImportancia">
                        <span class="selector-label">Media</span>
                    </div>
                <div class="form-selector-menu" id="menuImportancia">
                        <button type="button" value="baja">Baja</button>
                        <button type="button" value="media">Media</button>
                        <button type="button" value="alta">Alta</button>
                        <button type="button" value="importante">Importante</button>
                    </div>

                <div class="form-selector" id="sTipo">
                        <span class="selector-label">Una vez</span>
                    </div>
                <div class="form-selector-menu" id="menuTipo">
                        <button type="button" value="una vez">Una vez</button>
                        <button type="button" value="habito">Hábito</button>
                    </div>

                <div class="form-selector" id="sFechaLimite">
                        <span class="selector-label">🗓️ Fecha</span>
                    </div>
                
                <div class="form-selector" id="sSeccion">
                         <span class="selector-label">📁 Sección</span>
                    </div>
                <div class="form-selector-menu" id="menuSeccion">
                         </div>


                <div class="cal-contenedor" id="calCont">
                        <div class="cal-nav">
                                <button type="button" id="calPrev">&lt;</button>
                                <span id="calMesAnio"></span>
                                <button type="button" id="calNext">&gt;</button>
                            </div>
                        <table class="cal-tabla">
                                <thead>
                                        <tr id="calDiasSemana"></tr>
                                    </thead>
                                <tbody id="calBody"></tbody>
                          </table>
                        <div class="cal-acciones">
                                <button type="button" id="calHoyBtn">Hoy</button>
                                <button type="button" id="calBorrarBtn">Borrar</button>
                            </div>
                    </div>

                <button type="submit">Crear</button>
            </form>


        <div id="listaTareas">
                <?php if (empty($tareasPorSeccion) || $tareasPorSeccion->isEmpty()) : ?>
                        <p>Aún no hay tareas. ¡Crea una para empezar!</p>
                    <?php else : ?>
                        <?php foreach ($tareasPorSeccion as $seccion => $tareas) : ?>
                                <div class="seccion-container" data-seccion-nombre="<?= htmlspecialchars($seccion) ?>">
                                        <h2><?= htmlspecialchars($seccion) ?></h2>
                                        <ul class="tareas-lista">
                                                <?php foreach ($tareas as $tarea) : ?>
                                                        <?php $renderTarea($tarea); ?>
                                                    <?php endforeach; ?>
                                            </ul>
                                    </div>
                            <?php endforeach; ?>
                    <?php endif; ?>
            </div>

        <script src="/js/taskForm.js"></script>
        <script src="/js/taskCRUD.js"></script>
        <script src="/js/taskArchive.js"></script>
        <script src="/js/taskDragDrop.js"></script>
        <script src="/js/taskSections.js"></script>
        <script src="/js/taskDates.js"></script>
        <script src="/js/taskProperties.js"></script>
        <script src="/js/taskHabits.js"></script>
       
    <link rel="stylesheet" href="/css/global.css">
</body>

</html>