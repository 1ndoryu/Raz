// public/js/taskCRUD.js

function enviarAjax(metodo, url, datos = null) {
    const opciones = {
        method: metodo,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    };

    if (datos !== null) {
        opciones.body = JSON.stringify(datos);
    }
    
    console.log(`[AJAX Request] -> ${metodo} ${url}`, datos || '');

    return fetch(url, opciones)
        .then(async res => {
            let payload = null;
            const textResponse = await res.text();
            try {
                if(textResponse) payload = JSON.parse(textResponse);
            } catch (e) {
                console.error('[AJAX] Error al parsear JSON:', textResponse);
                payload = { success: false, error: 'Respuesta inválida del servidor.' };
            }

            const infoRespuesta = {
                url,
                status: res.status,
                ok: res.ok,
                payload: payload
            };

            if (!res.ok) {
                console.error(`[AJAX Response] <- ${res.status} ${url}`, infoRespuesta);
                // Si el payload ya tiene un error, lo usamos, si no, creamos uno genérico.
                return Promise.reject(payload || { success: false, error: `Error HTTP ${res.status}` });
            }
            
            console.log(`[AJAX Response] <- ${res.status} ${url}`, infoRespuesta);
            return payload || { success: true };
        })
        .catch(err => {
            console.error(`[AJAX] Fallo de red para ${metodo} ${url}`, err);
            throw err;
        });
}


window.addEventListener('DOMContentLoaded', () => {
    const formCrear = document.getElementById('formCrearTarea');
    const listaTareas = document.getElementById('listaTareas');

    if (formCrear) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputTitulo = formCrear.querySelector('input[name="titulo"]');
            const titulo = inputTitulo.value.trim();
            if (titulo === '') return;

            try {
                const respuesta = await enviarAjax('POST', '/tareas/', { titulo });
                if (respuesta.success) {
                    // Recargar la página para ver la nueva tarea. Es una solución simple y robusta.
                    window.location.reload();
                } else {
                    console.error('No se pudo crear la tarea:', respuesta.error || 'Error desconocido.');
                }
            } catch (err) {
                console.error('Error de red al crear la tarea:', err);
            }
        });
    }

    if (listaTareas) {
        listaTareas.addEventListener('click', (e) => {
            const btnCompletar = e.target.closest('.btn-completar');
            const tituloSpan = e.target.closest('.titulo');

            if (btnCompletar) {
                const li = btnCompletar.closest('li.tarea');
                if (li) completarTarea(li);
            } else if (tituloSpan) {
                activarEdicionTítulo(tituloSpan);
            }
        });

        listaTareas.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                const elementoActivo = document.activeElement;
                if (elementoActivo && elementoActivo.classList.contains('titulo')) {
                    const li = elementoActivo.closest('li.tarea');
                    if (li && elementoActivo.innerText.trim() === '') {
                        if (li.dataset.backspaceCount === '1') {
                            borrarTarea(li);
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
        } catch (err) { console.error(`Error de red al completar tarea ${id}:`, err); }
    }

    function activarEdicionTítulo(span) {
        if (span.isContentEditable) return;
        const li = span.closest('li.tarea');
        const id = li.dataset.tareaId;
        console.log(`[CRUD] Activando edición para tarea ${id}`);
        
        const valorOriginal = span.textContent;
        span.contentEditable = 'true';
        span.focus();

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
                const res = await enviarAjax('PUT', `/tareas/${id}`, { titulo: nuevoTitulo });
                if (!res.success) {
                    console.error(`No se pudo guardar la tarea ${id}:`, res.error);
                    span.textContent = valorOriginal;
                }
            } catch (err) {
                console.error(`Error de red al guardar tarea ${id}:`, err);
                span.textContent = valorOriginal;
            }
        };
        
        const manejarTeclas = (e) => {
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

    async function borrarTarea(li) {
        const id = li.dataset.tareaId;
        console.log(`[CRUD] Borrando tarea ${id}`);
        try {
            const res = await enviarAjax('DELETE', `/tareas/${id}`);
            if (res.success) {
                li.remove();
            } else {
                console.error(`No se pudo borrar la tarea ${id}:`, res.error);
            }
        } catch (err) { console.error(`Error de red al borrar tarea ${id}:`, err); }
    }
});