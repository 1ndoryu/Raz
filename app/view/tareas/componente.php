<?php
/** @var \app\model\Tarea $t */
?>
<li class="tarea" data-tarea="<?= $t->id ?>">
    <span class="titulo"><?= htmlspecialchars($t->titulo) ?></span>
    <button class="btn-archivar" title="Archivar / desarchivar">📥</button>
</li> 