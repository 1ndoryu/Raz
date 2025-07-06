// public/js/taskCRUD.js

/**
 * Función AJAX global mejorada para manejar las peticiones a la API.
 * Utiliza async/await y maneja errores de forma centralizada.
 * Cualquier error (red, HTTP no-2xx, JSON inválido) resultará en una promesa rechazada.
 * @param {string} metodo - Método HTTP (GET, POST, PUT, DELETE).
 * @param {string} url - URL del endpoint.
 * @param {object|null} datos - Objeto con los datos a enviar en el body.
 * @returns {Promise<any>} Promesa que resuelve con el payload de la respuesta exitosa.
 */
async function enviarAjax(metodo, url, datos = null) {
    const opciones = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    };

    if (datos !== null) {
        opciones.body = JSON.stringify(datos);
    }

    console.log(`[AJAX Request] -> ${metodo} ${url}`, datos || '');

    try {
        const response = await fetch(url, opciones);

        // Respuestas 204 No Content son exitosas pero no tienen cuerpo.
        if (response.status === 204) {
            console.log(`[AJAX Response] <- 204 No Content ${url}`);
            return {
                success: true
            };
        }

        const textResponse = await response.text();
        let payload;

        try {
            // Solo intentar parsear si hay contenido.
            payload = textResponse ? JSON.parse(textResponse) : null;
        } catch (e) {
            console.error('[AJAX] Error al parsear JSON:', textResponse);
            throw {
                success: false,
                error: 'Respuesta inválida del servidor (JSON malformado).'
            };
        }

        console.log(`[AJAX Response] <- ${response.status} ${url}`, {
            ok: response.ok,
            payload
        });

        if (!response.ok) {
            const errorMessage = payload?.error || `Error HTTP ${response.status}`;
            throw {
                success: false,
                error: errorMessage,
                status: response.status
            };
        }

        return payload; // Devuelve el cuerpo de la respuesta parseado.
    } catch (error) {
        console.error(`[AJAX] Fallo en la llamada a ${metodo} ${url}`, error);
        // Re-lanza el error para que el 'catch' del llamador lo reciba.
        // Asegura que siempre tenga una propiedad 'error' para consistencia.
        if (typeof error === 'object' && error !== null && 'error' in error) {
            throw error;
        } else {
            throw {
                success: false,
                error: 'Error de red o conexión.'
            };
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const formCrear = document.getElementById('formCrearTarea');
    const listaTareas = document.getElementById('listaTareas');

    if (formCrear) {
        formCrear.addEventListener('submit', async e => {
            e.preventDefault();
            const datosTarea = TaskForm.getDatos();
            if (datosTarea.titulo === '') return;

            try {
                const respuesta = await enviarAjax('POST', '/tareas', datosTarea);
                if (respuesta.success && respuesta.data?.html) {
                    TaskForm.limpiar();

                    const htmlNuevaTarea = respuesta.data.html;
                    const contenedorTareas = document.getElementById('listaTareas');

                    // 1. Quitar el mensaje de "no hay tareas" si existe.
                    const mensajeVacio = contenedorTareas.querySelector('p');
                    if (mensajeVacio && mensajeVacio.textContent.includes('Aún no hay tareas')) {
                        mensajeVacio.remove();
                    }

                    // 2. Buscar o crear la sección "General".
                    let seccionGeneral = contenedorTareas.querySelector('.seccion-container[data-seccion-nombre="General"]');
                    if (!seccionGeneral) {
                        seccionGeneral = document.createElement('div');
                        seccionGeneral.className = 'seccion-container';
                        seccionGeneral.dataset.seccionNombre = 'General';
                        seccionGeneral.innerHTML = `<h2>General</h2><ul class="tareas-lista"></ul>`;
                        // Insertar al principio, o donde corresponda según tu lógica de orden.
                        contenedorTareas.prepend(seccionGeneral);
                        console.log('[CRUD] Sección "General" creada dinámicamente.');
                    }

                    // 3. Insertar la nueva tarea.
                    const listaDestino = seccionGeneral.querySelector('ul.tareas-lista');
                    listaDestino.insertAdjacentHTML('afterbegin', htmlNuevaTarea);
                    console.log(`[CRUD] Nueva tarea ${respuesta.data.id} insertada dinámicamente.`);
                } else {
                    const errorMsg = respuesta.error || '[CRUD] La respuesta del servidor no contenía el HTML de la tarea.';
                    // Loguear el objeto de respuesta completo para una depuración profunda
                    console.error(errorMsg, 'Objeto de respuesta completo:', respuesta);
                    alert('Error al crear tarea: ' + errorMsg + ' (Revisa la consola para más detalles).');
                }
            } catch (err) {
                console.error('No se pudo crear la tarea:', err.error || 'Error desconocido.');
                alert('Error al crear la tarea: ' + (err.error || 'Revise la consola para más detalles.'));
            }
        });
    }

    if (listaTareas) {
        listaTareas.addEventListener('click', e => {
            const btnCompletar = e.target.closest('.btn-completar');
            const tituloSpan = e.target.closest('.titulo');
            const btnBorrar = e.target.closest('.btn-borrar-tarea');

            if (btnCompletar) {
                const li = btnCompletar.closest('li.tarea');
                if (li) completarTarea(li);
            } else if (tituloSpan) {
                activarEdicionTítulo(tituloSpan);
            } else if (btnBorrar) {
                const li = btnBorrar.closest('li.tarea');
                if (li) borrarTarea(li);
            }
        });

        listaTareas.addEventListener('keydown', e => {
            if (e.key === 'Backspace') {
                const elementoActivo = document.activeElement;
                if (elementoActivo && elementoActivo.classList.contains('titulo')) {
                    const li = elementoActivo.closest('li.tarea');
                    if (li && elementoActivo.innerText.trim() === '') {
                        if (li.dataset.backspaceCount === '1') {
                            borrarTarea(li, true); // Omitir confirmación
                        } else {
                            li.dataset.backspaceCount = '1';
                            setTimeout(() => delete li.dataset.backspaceCount, 800);
                        }
                    }
                }
            }
        });
    }

    async function completarTarea(li) {
        const id = li.dataset.tareaId;
        console.log(`[CRUD] Completando tarea ${id}`);
        try {
            const res = await enviarAjax('POST', `/tareas/${id}/completar`);
            if (res.success) {
                li.classList.toggle('completada');
            } else {
                console.error(`No se pudo completar la tarea ${id}:`, res.error);
            }
        } catch (err) {
            console.error(`Error de red al completar tarea ${id}:`, err.error || err);
        }
    }

    function activarEdicionTítulo(span) {
        if (span.isContentEditable) return;
        const li = span.closest('li.tarea');
        const id = li.dataset.tareaId;
        console.log(`[CRUD] Activando edición para tarea ${id}`);

        const valorOriginal = span.textContent;
        span.contentEditable = 'true';
        span.focus();
        document.execCommand('selectAll', false, null);

        const guardarCambios = async () => {
            span.removeEventListener('blur', guardarCambios);
            span.removeEventListener('keydown', manejarTeclas);
            span.contentEditable = 'false';
            const nuevoTitulo = span.innerText.trim();

            if (nuevoTitulo === '' || nuevoTitulo === valorOriginal) {
                span.textContent = valorOriginal;
                console.log(`[CRUD] Edición cancelada o sin cambios para tarea ${id}`);
                return;
            }

            console.log(`[CRUD] Guardando nuevo título para tarea ${id}: "${nuevoTitulo}"`);
            try {
                const res = await enviarAjax('PUT', `/tareas/${id}`, {
                    titulo: nuevoTitulo
                });
                if (!res.success) {
                    console.error(`No se pudo guardar la tarea ${id}:`, res.error);
                    span.textContent = valorOriginal;
                }
            } catch (err) {
                console.error(`Error de red al guardar tarea ${id}:`, err.error || err);
                span.textContent = valorOriginal;
            }
        };

        const manejarTeclas = e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                span.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                span.textContent = valorOriginal;
                span.blur();
            }
        };

        span.addEventListener('blur', guardarCambios);
        span.addEventListener('keydown', manejarTeclas);
    }

    async function borrarTarea(li, omitirConfirmacion = false) {
        if (!omitirConfirmacion) {
            if (!confirm('¿Estás seguro de que quieres borrar esta tarea?')) {
                return;
            }
        }

        const id = li.dataset.tareaId;
        console.log(`[CRUD] Borrando tarea ${id}`);
        try {
            await enviarAjax('DELETE', `/tareas/${id}`);
            li.remove();
        } catch (err) {
            console.error(`No se pudo borrar la tarea ${id}:`, err.error || 'Error desconocido.');
        }
    }
});