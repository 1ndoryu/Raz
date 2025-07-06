// public/js/taskArchive.js
(function() {
    console.log('[Raziel] Módulo de Archivo inicializado.');
    const listaTareasContainer = document.getElementById('listaTareas');
    if (!listaTareasContainer) {
        console.error('[Archive] Contenedor de lista de tareas no encontrado.');
        return;
    }

    /**
     * Encuentra un contenedor de sección o lo crea si no existe.
     * @param {string} nombreSeccion El nombre de la sección a buscar/crear.
     * @returns {HTMLElement} El elemento UL de la lista de tareas de la sección.
     */
    function findOrCreateSectionList(nombreSeccion) {
        let container = listaTareasContainer.querySelector(`.seccion-container[data-seccion-nombre="${nombreSeccion}"]`);
        if (!container) {
            container = document.createElement('div');
            container.className = 'seccion-container';
            container.dataset.seccionNombre = nombreSeccion;
            container.innerHTML = `<h2>${nombreSeccion}</h2><ul class="tareas-lista"></ul>`;

            if (nombreSeccion.toLowerCase() === 'archivado') {
                listaTareasContainer.appendChild(container);
            } else {
                const seccionArchivado = listaTareasContainer.querySelector('.seccion-container[data-seccion-nombre="Archivado"]');
                if (seccionArchivado) {
                    listaTareasContainer.insertBefore(container, seccionArchivado);
                } else {
                    listaTareasContainer.appendChild(container);
                }
            }
        }
        return container.querySelector('ul.tareas-lista');
    }

    listaTareasContainer.addEventListener('click', async (e) => {
        const btnArchivar = e.target.closest('.btn-archivar');
        if (btnArchivar) {
            const li = btnArchivar.closest('li.tarea');
            if (!li) return;

            const id = li.dataset.tareaId;
            console.log(`[Archive] Intentando archivar/desarchivar tarea ${id}`);

            try {
                const res = await enviarAjax('POST', `/tareas/${id}/archivar`);
                if (res.success) {
                    const esArchivadoAhora = res.data.estado === 'archivado';
                    console.log(`[Archive] Tarea ${id} actualizada al estado: ${res.data.estado}`);

                    // Mover la tarea y sus subtareas
                    const elementosAMover = [li];
                    if (li.classList.contains('tarea-padre')) {
                        const subtareas = document.querySelectorAll(`li.subtarea[data-padre-id="${id}"]`);
                        elementosAMover.push(...subtareas);
                    }
                    
                    const listaOriginalContainer = li.closest('.seccion-container');

                    if (esArchivadoAhora) {
                        const listaDestino = findOrCreateSectionList('Archivado');
                        elementosAMover.forEach(elem => {
                            listaDestino.appendChild(elem);
                            elem.dataset.seccion = 'Archivado';
                        });
                    } else {
                        const listaDestino = findOrCreateSectionList('General');
                         elementosAMover.forEach(elem => {
                            listaDestino.prepend(elem); // Al principio de General
                            elem.dataset.seccion = 'General';
                        });
                    }
                    
                    // Si la sección original quedó vacía (y no es 'General'), la eliminamos.
                    if (listaOriginalContainer && 
                        listaOriginalContainer.dataset.seccionNombre.toLowerCase() !== 'general' &&
                        listaOriginalContainer.querySelector('ul.tareas-lista').children.length === 0) {
                        console.log(`[Archive] Eliminando sección vacía: "${listaOriginalContainer.dataset.seccionNombre}"`);
                        listaOriginalContainer.remove();
                    }

                } else {
                    console.error(`[Archive] No se pudo archivar la tarea ${id}:`, res.error || 'Error desconocido.');
                }
            } catch (err) {
                console.error(`[Archive] Error de red al archivar la tarea ${id}:`, err);
            }
        }
    });
})();