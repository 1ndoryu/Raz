// public/js/taskDragDrop.js
(function () {
    console.log('[Raziel] Módulo de Arrastrar y Soltar inicializado.');
    const listaTareasContainer = document.getElementById('listaTareas');
    if (!listaTareasContainer) {
        console.error('[DragDrop] Contenedor de lista de tareas no encontrado.');
        return;
    }

    let draggedElement = null;
    let draggedElementClone = null;
    let placeholder = null;
    let isDragging = false;
    let offsetY = 0;
    let offsetX = 0;

    // --- Funciones de Drag & Drop ---

    const dragStart = e => {
        if (e.button !== 0) return;

        const target = e.target.closest('li.tarea');
        if (!target) return;

        if (e.target.closest('button, input, .titulo[contenteditable="true"]')) {
            return;
        }

        draggedElement = target;
        const parentList = draggedElement.closest('ul.tareas-lista');
        if (!parentList) {
            console.error('[DragDrop] No se pudo encontrar la lista padre del elemento arrastrado.');
            return;
        }

        isDragging = true;
        const rect = draggedElement.getBoundingClientRect();
        offsetY = e.clientY - rect.top;
        offsetX = e.clientX - rect.left;

        draggedElementClone = draggedElement.cloneNode(true);
        draggedElementClone.style.position = 'absolute';
        draggedElementClone.style.pointerEvents = 'none';
        draggedElementClone.style.zIndex = '1000';
        draggedElementClone.style.width = `${rect.width}px`;
        draggedElementClone.style.opacity = '0.8';
        document.body.appendChild(draggedElementClone);
        moveClone(e);

        draggedElement.classList.add('dragging');

        placeholder = document.createElement('li');
        placeholder.className = 'placeholder';
        placeholder.style.height = `${rect.height}px`;

        parentList.insertBefore(placeholder, draggedElement);

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
    };

    const dragMove = e => {
        if (!isDragging || !draggedElement) return;
        e.preventDefault();

        moveClone(e);

        const { currentTarget, isSubtaskTarget } = getDropTarget(e);

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

                    if (isAfter) {
                        targetParentList.insertBefore(placeholder, currentTarget.nextSibling);
                    } else {
                        targetParentList.insertBefore(placeholder, currentTarget);
                    }
                }
            }
        }
    };

    const dragEnd = async e => {
        if (!isDragging || !draggedElement) {
            cleanUp();
            return;
        }

        const draggedId = draggedElement.dataset.tareaId;
        const { currentTarget, isSubtaskTarget } = getDropTarget(e);
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
            const esSubtarea = !!draggedElement.dataset.padreId;
            if (!esSubtarea) {
                 await asignarSeccion(draggedId, seccion);
            } else {
                // Si es una subtarea que se mueve dentro de su lista, no cambiamos la seccion,
                // pero si la desanidamos, la llamada a asignarPadre(id, null) se encargará.
                await asignarPadre(draggedId, null);
            }
            accionRealizada = true;
        } else {
            console.log('[DragDrop] Drop en una ubicación no válida.');
        }
        
        cleanUp();
        
        if (accionRealizada) {
            // Recargar para reflejar el estado correcto del servidor.
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
        isDragging = false;
    }

    const getDropTarget = e => {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetLi = elements.find(el => el.matches('li.tarea') && el !== draggedElement && !el.classList.contains('dragging'));

        if (!targetLi) return { currentTarget: null, isSubtaskTarget: false };

        if (draggedElement.contains(targetLi)) {
            return { currentTarget: null, isSubtaskTarget: false };
        }

        if (targetLi.classList.contains('subtarea')) {
            return { currentTarget: targetLi, isSubtaskTarget: false };
        }

        if (draggedElement.classList.contains('tarea-padre')) {
            return { currentTarget: targetLi, isSubtaskTarget: false };
        }

        const rect = targetLi.getBoundingClientRect();
        const isSubtaskTarget = e.clientX > rect.left + rect.width / 2;

        return { currentTarget: targetLi, isSubtaskTarget };
    };

    const moveClone = e => {
        if (draggedElementClone) {
            draggedElementClone.style.left = `${e.clientX - offsetX}px`;
            draggedElementClone.style.top = `${e.clientY - offsetY}px`;
        }
    };

    const asignarPadre = async (hijoId, padreId) => {
        try {
            const respuesta = await enviarAjax('PUT', `/tareas/${hijoId}/padre`, { padre_id: padreId });
            if (!respuesta.success) console.error(`[DragDrop] Error al anidar tarea: ${respuesta.error || 'Error desconocido'}`);
        } catch (err) {
            console.error('[DragDrop] Error de red al anidar la tarea:', err);
        }
    };

    const asignarSeccion = async (tareaId, seccion) => {
        if (!seccion || seccion === '') return;
        try {
            const respuesta = await enviarAjax('PUT', `/tareas/${tareaId}/seccion`, { seccion: seccion });
            if (!respuesta.success) console.error(`[DragDrop] Error al cambiar sección: ${respuesta.error || 'Error desconocido'}`);
        } catch (err) {
            console.error('[DragDrop] Error de red al cambiar de sección:', err);
        }
    };

    listaTareasContainer.addEventListener('mousedown', dragStart);
})();