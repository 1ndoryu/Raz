// Helper central para peticiones AJAX
function enviarAjax(metodo, url, datos = null) {
    const opciones = {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    if (datos !== null) {
        opciones.body = JSON.stringify(datos);
    }
    return fetch(url, opciones)
        .then(res => res.json())
        .catch(err => {
            console.error('Error de red', err);
            throw err;
        });
}

// Esperar al DOM cargado
window.addEventListener('DOMContentLoaded', () => {
    const formCrear = document.getElementById('formCrearTarea');
    const listaTareas = document.getElementById('listaTareas');

    // Crear tarea
    if (formCrear) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();
            const inputTitulo = formCrear.querySelector('input[name="titulo"]');
            const titulo = inputTitulo.value.trim();
            if (titulo === '') return;

            try {
                const respuesta = await enviarAjax('POST', '/tareas', { titulo });
                if (respuesta.success) {
                    const tareaId = respuesta.data.tareaId;
                    agregarTareaAlDom({ id: tareaId, titulo });
                    inputTitulo.value = '';
                } else {
                    alert(respuesta.error || 'No se pudo crear la tarea');
                }
            } catch (err) {
                alert('Error de red');
            }
        });
    }

    // Delegar eventos en la lista
    listaTareas.addEventListener('click', (e) => {
        const objetivo = e.target;
        // Completar con doble click en el li
        if (objetivo.closest('li.tarea') && e.detail === 2) {
            const li = objetivo.closest('li.tarea');
            completarTarea(li);
        }
        // Editar título al hacer click en el span
        if (objetivo.classList.contains('titulo')) {
            activarEdicionTítulo(objetivo);
        }
    });

    // Manejar tecla Backspace para borrar cuando el título está vacío
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            const elementoActivo = document.activeElement;
            if (elementoActivo && elementoActivo.classList.contains('titulo')) {
                const li = elementoActivo.closest('li.tarea');
                if (li && elementoActivo.innerText.trim() === '') {
                    // Segunda pulsación borra
                    if (li.dataset.backspaceCount === '1') {
                        borrarTarea(li);
                    } else {
                        li.dataset.backspaceCount = '1';
                        setTimeout(() => delete li.dataset.backspaceCount, 500);
                    }
                }
            }
        }
    });

    // Funciones auxiliares
    function agregarTareaAlDom({ id, titulo }) {
        const ulGeneral = listaTareas.querySelector('h2')?.nextElementSibling || crearSeccionGeneral();
        const li = document.createElement('li');
        li.className = 'tarea';
        li.dataset.tarea = id;
        const span = document.createElement('span');
        span.className = 'titulo';
        span.textContent = titulo;
        li.appendChild(span);
        ulGeneral.appendChild(li);
    }

    function crearSeccionGeneral() {
        // Si no existe sección "General" la creamos al vuelo
        const h2 = document.createElement('h2');
        h2.textContent = 'General';
        const ul = document.createElement('ul');
        listaTareas.appendChild(h2);
        listaTareas.appendChild(ul);
        return ul;
    }

    async function completarTarea(li) {
        const id = li.dataset.tarea;
        try {
            const res = await enviarAjax('POST', `/tareas/${id}/completar`);
            if (res.success) {
                li.classList.toggle('completada');
            } else {
                alert(res.error || 'No se pudo completar');
            }
        } catch (_) { alert('Error de red'); }
    }

    function activarEdicionTítulo(span) {
        span.contentEditable = 'true';
        span.focus();

        const guardarCambios = async () => {
            span.contentEditable = 'false';
            const nuevoTitulo = span.innerText.trim();
            const id = span.closest('li.tarea').dataset.tarea;
            if (nuevoTitulo === '') return;
            try {
                const res = await enviarAjax('PUT', `/tareas/${id}`, { titulo: nuevoTitulo });
                if (!res.success) {
                    alert(res.error || 'No se pudo guardar');
                }
            } catch (_) { alert('Error de red'); }
        };

        span.addEventListener('blur', guardarCambios, { once: true });
        span.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                span.blur();
            }
        }, { once: true });
    }

    async function borrarTarea(li) {
        const id = li.dataset.tarea;
        try {
            const res = await enviarAjax('DELETE', `/tareas/${id}`);
            if (res.success) {
                li.remove();
            } else {
                alert(res.error || 'No se pudo borrar');
            }
        } catch (_) { alert('Error de red'); }
    }
});