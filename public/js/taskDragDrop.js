// public/js/taskDragDrop.js
(function() {
    console.log('[Raziel] Módulo de Arrastrar y Soltar inicializado.');
    const listaTareasContainer = document.getElementById('listaTareas');
    if (!listaTareasContainer) {
        console.error('[DragDrop] Contenedor de lista de tareas no encontrado.');
        return;
    }

    let draggedElement = null;
    let draggedElementClone = null;
    let placeholder = null;
    let isMouseDown = false;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let offsetY = 0;
    let offsetX = 0;
    const DRAG_THRESHOLD = 5; // Píxeles que el ratón debe moverse para iniciar un arrastre

    const dragStart = e => {
        if (e.button !== 0) return; // Solo clic izquierdo

        const target = e.target.closest('li.tarea');
        if (!target) return;

        // Prevenir arrastre al hacer clic en elementos interactivos
        if (e.target.closest('button, input, [contenteditable="true"]')) {
            return;
        }

        draggedElement = target;
        isMouseDown = true; // El ratón está presionado, es un posible arrastre
        isDragging = false; // El arrastre real aún no ha comenzado

        const rect = draggedElement.getBoundingClientRect();
        // Guardar posiciones iniciales
        startX = e.clientX;
        startY = e.clientY;
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
    };

    const dragMove = e => {
        if (!isMouseDown || !draggedElement) return;
        e.preventDefault();

        if (!isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
                return; // No iniciar arrastre todavía
            }
            isDragging = true; // Umbral superado, comienza el arrastre real

            // --- Inicializar arrastre visual ---
            const rect = draggedElement.getBoundingClientRect();
            draggedElementClone = draggedElement.cloneNode(true);
            draggedElementClone.style.position = 'absolute';
            draggedElementClone.style.pointerEvents = 'none';
            draggedElementClone.style.zIndex = '1000';
            draggedElementClone.style.width = `${rect.width}px`;
            draggedElementClone.style.opacity = '0.8';
            document.body.appendChild(draggedElementClone);
            moveClone(e);

            placeholder = document.createElement('li');
            placeholder.className = 'placeholder';
            placeholder.style.height = `${rect.height}px`;

            draggedElement.classList.add('dragging'); // Ocultar elemento original
            draggedElement.parentElement.insertBefore(placeholder, draggedElement);
        }

        // Esta parte solo se ejecuta después de que el arrastre ha comenzado
        moveClone(e);
        const {
            currentTarget,
            isSubtaskTarget
        } = getDropTarget(e);
        document.querySelectorAll('.drop-target-parent').forEach(el => el.classList.remove('drop-target-parent'));

        if (currentTarget) {
            const targetParentList = currentTarget.closest('ul.tareas-lista');
            if (!targetParentList) return;

            if (isSubtaskTarget) {
                currentTarget.classList.add('drop-target-parent');
                if (placeholder) placeholder.style.display = 'none';
            } else {
                if (placeholder) {
                    placeholder.style.display = 'block';
                    const rect = currentTarget.getBoundingClientRect();
                    const isAfter = e.clientY > rect.top + rect.height / 2;
                    targetParentList.insertBefore(placeholder, isAfter ? currentTarget.nextSibling : currentTarget);
                }
            }
        }
    };

    const dragEnd = async e => {
        if (!isMouseDown) return;

        // Si nunca se movió lo suficiente, fue solo un clic, no un arrastre.
        if (!isDragging) {
            cleanUp();
            return;
        }

        const draggedId = draggedElement.dataset.tareaId;
        const {
            currentTarget,
            isSubtaskTarget
        } = getDropTarget(e);
        let accionRealizada = false;

        if (currentTarget && isSubtaskTarget) {
            const parentId = currentTarget.dataset.tareaId;
            console.log(`[DragDrop] Anidando tarea ${draggedId} bajo ${parentId}`);
            await asignarPadre(draggedId, parentId);
            accionRealizada = true;
        } else if (placeholder && placeholder.parentNode) {
            const seccionContainer = placeholder.closest('.seccion-container');
            const seccion = seccionContainer ? seccionContainer.dataset.seccionNombre : 'General';
            placeholder.parentNode.insertBefore(draggedElement, placeholder);
            console.log(`[DragDrop] Reordenando tarea ${draggedId} en la sección ${seccion}`);
            const esSubtareaPrevia = !!draggedElement.dataset.padreId;
            if (esSubtareaPrevia) {
                await asignarPadre(draggedId, null);
            }
            await asignarSeccion(draggedId, seccion);
            accionRealizada = true;
        } else {
            console.log('[DragDrop] Drop en una ubicación no válida.');
        }

        cleanUp();
        if (accionRealizada) {
            window.location.reload();
        }
    };

    function cleanUp() {
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
        if (draggedElementClone) draggedElementClone.remove();
        if (placeholder) placeholder.remove();
        if (draggedElement) draggedElement.classList.remove('dragging');
        document.querySelectorAll('.drop-target-parent').forEach(el => el.classList.remove('drop-target-parent'));

        draggedElement = null;
        draggedElementClone = null;
        placeholder = null;
        isMouseDown = false;
        isDragging = false;
    }

    const getDropTarget = e => {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetLi = elements.find(el => el.matches('li.tarea') && el !== draggedElement && !el.classList.contains('dragging'));
        if (!targetLi || draggedElement.contains(targetLi)) return {
            currentTarget: null,
            isSubtaskTarget: false
        };
        if (targetLi.classList.contains('subtarea') || draggedElement.classList.contains('tarea-padre')) {
            return {
                currentTarget: targetLi,
                isSubtaskTarget: false
            };
        }
        const rect = targetLi.getBoundingClientRect();
        const isSubtaskTarget = e.clientX > rect.left + 30; // Aumentar zona para anidar
        return {
            currentTarget: targetLi,
            isSubtaskTarget
        };
    };

    const moveClone = e => {
        if (draggedElementClone) {
            draggedElementClone.style.left = `${e.clientX - offsetX}px`;
            draggedElementClone.style.top = `${e.clientY - offsetY}px`;
        }
    };

    const asignarPadre = async (hijoId, padreId) => {
        try {
            const respuesta = await enviarAjax('PUT', `/tareas/${hijoId}/padre`, {
                padre_id: padreId
            });
            if (!respuesta.success) console.error(`[DragDrop] Error al anidar tarea: ${respuesta.error || 'Error desconocido'}`);
        } catch (err) {
            console.error('[DragDrop] Error de red al anidar la tarea:', err);
        }
    };

    const asignarSeccion = async (tareaId, seccion) => {
        if (!seccion || seccion === '') return;
        try {
            const respuesta = await enviarAjax('PUT', `/tareas/${tareaId}/seccion`, {
                seccion: seccion
            });
            if (!respuesta.success) console.error(`[DragDrop] Error al cambiar sección: ${respuesta.error || 'Error desconocido'}`);
        } catch (err) {
            console.error('[DragDrop] Error de red al cambiar de sección:', err);
        }
    };

    listaTareasContainer.addEventListener('mousedown', dragStart);
})();