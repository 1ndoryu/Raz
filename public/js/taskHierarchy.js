// public/js/taskHierarchy.js
(function () {
    console.log('[Raziel] Módulo de Jerarquía inicializado.');

    const listaTareas = document.getElementById('listaTareas');
    if (!listaTareas) {
        console.error('[Hierarchy] Contenedor de lista de tareas no encontrado.');
        return;
    }

    let draggedElement = null;

    listaTareas.addEventListener('dragstart', e => {
        if (e.target.classList.contains('tarea')) {
            draggedElement = e.target;
            console.log('[Hierarchy] dragstart:', draggedElement.dataset.tareaId);
            e.dataTransfer.setData('text/plain', e.target.dataset.tareaId);
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    listaTareas.addEventListener('dragover', e => {
        e.preventDefault();
        const targetLi = e.target.closest('li.tarea');

        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));

        if (targetLi && targetLi !== draggedElement && !draggedElement.contains(targetLi)) {
            // --- INICIO DE MODIFICACIÓN: Validar anidación ---
            const esSubtarea = targetLi.dataset.padreId && targetLi.dataset.padreId !== '';
            if (!esSubtarea) { // Solo se puede soltar sobre tareas principales
                targetLi.classList.add('drop-target');
            }
            // --- FIN DE MODIFICACIÓN ---
        }
    });

    listaTareas.addEventListener('dragleave', e => {
        const targetLi = e.target.closest('li.tarea');
        if (targetLi) {
            targetLi.classList.remove('drop-target');
        }
    });

    listaTareas.addEventListener('drop', async e => {
        e.preventDefault();
        e.stopPropagation();
        const dropTarget = document.querySelector('.drop-target');
        if (dropTarget) dropTarget.classList.remove('drop-target');

        if (!draggedElement || !dropTarget || dropTarget === draggedElement || draggedElement.contains(dropTarget)) {
            console.log('[Hierarchy] Drop inválido (sobre sí mismo, un descendiente o no hay un objetivo válido).');
            return;
        }

        const draggedId = draggedElement.dataset.tareaId;
        const targetId = dropTarget.dataset.tareaId;
        console.log(`[Hierarchy] drop: Anidando tarea ${draggedId} bajo ${targetId}`);

        try {
            const respuesta = await enviarAjax('PUT', `/tareas/${draggedId}/padre`, { padre_id: targetId });
            if (respuesta.success) {
                console.log(`[Hierarchy] API success: Tarea ${draggedId} ahora es hija de ${targetId}`);
                let sublista = dropTarget.querySelector('.subtareas-lista');
                if (!sublista) {
                    sublista = document.createElement('ul');
                    sublista.className = 'subtareas-lista';
                    dropTarget.appendChild(sublista);
                }
                sublista.appendChild(draggedElement);
                draggedElement.dataset.padreId = targetId;
            } else {
                console.error(`[Hierarchy] Error al anidar tarea: ${respuesta.error || 'Error desconocido'}`);
            }
        } catch (err) {
            console.error('[Hierarchy] Error de red al anidar la tarea:', err);
        }
    });

    listaTareas.addEventListener('dragend', e => {
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        draggedElement = null;
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        console.log('[Hierarchy] dragend');
    });

})();