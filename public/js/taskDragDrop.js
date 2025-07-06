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

        if (e.target.closest('button, input, [contenteditable="true"]')) {
            return;
        }

        draggedElement = target;
        isMouseDown = true;
        isDragging = false;

        const rect = draggedElement.getBoundingClientRect();
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
                return;
            }
            isDragging = true;

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

            draggedElement.classList.add('dragging');
            draggedElement.parentElement.insertBefore(placeholder, draggedElement);
        }

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

    // --- MODIFICADO: `dragEnd` ahora actualiza el DOM en lugar de recargar la página ---
    const dragEnd = async e => {
        if (!isMouseDown) return;
        
        const wasDragging = isDragging;
        
        // Obtenemos el destino final antes de limpiar el placeholder
        const { currentTarget, isSubtaskTarget } = getDropTarget(e);
        const placeholderFinalParent = placeholder ? placeholder.parentNode : null;
        const placeholderFinalSibling = placeholder ? placeholder.nextSibling : null;

        // Limpieza visual inmediata y de listeners
        cleanUpVisuals();

        if (!wasDragging || !draggedElement) {
            if (placeholder) placeholder.remove();
            resetState();
            return;
        }

        const draggedId = draggedElement.dataset.tareaId;

        try {
            let domUpdated = false;
            if (currentTarget && isSubtaskTarget) {
                // --- ACCIÓN: ANIDAR TAREA ---
                const parentElement = currentTarget;
                const parentId = parentElement.dataset.tareaId;
                await asignarPadre(draggedId, parentId);

                let subtasksList = parentElement.querySelector('ul.subtareas-lista');
                if (!subtasksList) {
                    subtasksList = document.createElement('ul');
                    subtasksList.className = 'subtareas-lista';
                    parentElement.appendChild(subtasksList);
                }
                subtasksList.appendChild(draggedElement);
                draggedElement.classList.add('subtarea');
                parentElement.classList.add('tarea-padre');
                draggedElement.dataset.padreId = parentId;
                draggedElement.dataset.seccion = parentElement.dataset.seccion;
                domUpdated = true;

            } else if (placeholderFinalParent) {
                // --- ACCIÓN: REORDENAR / MOVER SECCIÓN ---
                placeholderFinalParent.insertBefore(draggedElement, placeholderFinalSibling);
                domUpdated = true;

                const seccionContainer = draggedElement.closest('.seccion-container');
                const seccionNueva = seccionContainer ? seccionContainer.dataset.seccionNombre : 'General';
                const seccionAnterior = draggedElement.dataset.seccion;
                const eraSubtarea = !!draggedElement.dataset.padreId;

                if (eraSubtarea) await asignarPadre(draggedId, null);
                if (seccionAnterior !== seccionNueva) await asignarSeccion(draggedId, seccionNueva);

                draggedElement.classList.remove('subtarea');
                draggedElement.dataset.padreId = '';
                draggedElement.dataset.seccion = seccionNueva;
            }
            
            if (!domUpdated) {
                console.log('[DragDrop] Drop en ubicación no válida. No se realizaron cambios.');
            }

        } catch (err) {
            console.error("[DragDrop] Error en la operación de drop. Se recomienda recargar.", err);
            alert("Ocurrió un error al mover la tarea. Por favor, recargue la página para asegurar la consistencia.");
        } finally {
            if (placeholder) placeholder.remove();
            resetState();
        }
    };

    function cleanUpVisuals() {
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);

        if (draggedElementClone) draggedElementClone.remove();
        if (draggedElement) draggedElement.classList.remove('dragging');
        document.querySelectorAll('.drop-target-parent').forEach(el => el.classList.remove('drop-target-parent'));
        
        draggedElementClone = null;
    }
    
    // NUEVO: Función para resetear el estado al final
    function resetState() {
        draggedElement = null;
        isMouseDown = false;
        isDragging = false;
        startX = 0;
        startY = 0;
    }

    // --- MODIFICADO: `getDropTarget` con una condición más estricta para anidar ---
    const getDropTarget = e => {
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetLi = elements.find(el => el.matches('li.tarea') && el !== draggedElement && !el.classList.contains('dragging'));

        if (!targetLi || draggedElement.contains(targetLi)) {
            return { currentTarget: null, isSubtaskTarget: false };
        }

        // Reglas: No se puede anidar en una subtarea, y una tarea con hijos no puede ser anidada.
        if (targetLi.classList.contains('subtarea') || draggedElement.classList.contains('tarea-padre')) {
            return { currentTarget: targetLi, isSubtaskTarget: false };
        }
        
        const rect = targetLi.getBoundingClientRect();
        
        // Condición de anidación: el cursor debe moverse intencionadamente a la derecha
        // Y estar sobre la zona de indentación del elemento destino.
        const movedRight = e.clientX > startX + 25; // El usuario debe arrastrar hacia la derecha
        const inIndentZone = e.clientX > rect.left + 30; // Y estar en el área de anidación
        
        const isSubtaskTarget = movedRight && inIndentZone;
        
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
            throw err; // Relanzar para que dragEnd lo capture
        }
    };

    const asignarSeccion = async (tareaId, seccion) => {
        if (!seccion || seccion === '') return;
        try {
            const respuesta = await enviarAjax('PUT', `/tareas/${tareaId}/seccion`, { seccion: seccion });
            if (!respuesta.success) console.error(`[DragDrop] Error al cambiar sección: ${respuesta.error || 'Error desconocido'}`);
        } catch (err) {
            console.error('[DragDrop] Error de red al cambiar de sección:', err);
            throw err; // Relanzar para que dragEnd lo capture
        }
    };

    listaTareasContainer.addEventListener('mousedown', dragStart);
})();