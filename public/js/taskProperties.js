// public/js/taskProperties.js

(function () {
    console.log('[Raziel] Módulo de Propiedades de Tarea inicializado.');
    const listaTareas = document.getElementById('listaTareas');
    if (!listaTareas) {
        console.error('[Properties] Contenedor de lista de tareas no encontrado.');
        return;
    }

    let menuAbierto = null;
    let listenerDocumento = null;

    function cerrarMenuAbierto() {
        if (menuAbierto) {
            menuAbierto.remove();
            menuAbierto = null;
        }
        if (listenerDocumento) {
            document.removeEventListener('click', listenerDocumento);
            listenerDocumento = null;
        }
    }

    function posicionarMenu(menu, elementoReferencia) {
        const rect = elementoReferencia.getBoundingClientRect();
        menu.style.position = 'absolute';
        menu.style.top = `${window.scrollY + rect.bottom}px`;
        menu.style.left = `${window.scrollX + rect.left}px`;
        document.body.appendChild(menu);
        menuAbierto = menu;
    }

    listaTareas.addEventListener('click', e => {
        const btnPrioridad = e.target.closest('.btn-cambiar-prioridad');
        const btnFrecuencia = e.target.closest('.btn-cambiar-frecuencia');

        if (btnPrioridad) {
            e.stopPropagation();
            manejarClicPrioridad(btnPrioridad);
        } else if (btnFrecuencia) {
            e.stopPropagation();
            manejarClicFrecuencia(btnFrecuencia);
        }
    });

    function manejarClicPrioridad(boton) {
        cerrarMenuAbierto();

        const li = boton.closest('li.tarea');
        const id = li.dataset.tareaId;

        const menu = document.createElement('div');
        menu.className = 'menu-contextual';
        const prioridades = ['baja', 'media', 'alta', 'importante'];
        menu.innerHTML = prioridades.map(p => `<p data-prioridad="${p}">${p}</p>`).join('');

        posicionarMenu(menu, boton);

        menu.addEventListener('click', async e => {
            if (e.target.tagName === 'P') {
                const nuevaPrioridad = e.target.dataset.prioridad;
                console.log(`[Properties] Cambiando prioridad de tarea ${id} a ${nuevaPrioridad}`);
                try {
                    const res = await enviarAjax('PUT', `/tareas/${id}/prioridad`, {importancia: nuevaPrioridad});
                    if (res.success) {
                        window.location.reload();
                    } else {
                        console.error(`[Properties] No se pudo cambiar la prioridad:`, res.error);
                    }
                } catch (err) {
                    console.error(`[Properties] Error de red al cambiar prioridad:`, err);
                }
                cerrarMenuAbierto();
            }
        });

        listenerDocumento = event => {
            if (!menu.contains(event.target) && event.target !== boton) {
                cerrarMenuAbierto();
            }
        };
        document.addEventListener('click', listenerDocumento);
    }

    function manejarClicFrecuencia(boton) {
        cerrarMenuAbierto();
        const li = boton.closest('li.tarea');
        const id = li.dataset.tareaId;

        const menu = document.createElement('div');
        menu.className = 'menu-contextual';
        menu.innerHTML = `
            <p data-frecuencia="1">diaria</p>
            <p data-frecuencia="7">semanal</p>
            <p data-frecuencia="30">mensual</p>
            <div class="frecuencia-personalizada">
                <input type="number" min="1" placeholder="Días...">
                <button>OK</button>
            </div>
        `;
        posicionarMenu(menu, boton);

        menu.addEventListener('click', async e => {
            let nuevaFrecuencia = null;
            if (e.target.tagName === 'P' && e.target.dataset.frecuencia) {
                nuevaFrecuencia = parseInt(e.target.dataset.frecuencia, 10);
            } else if (e.target.tagName === 'BUTTON') {
                const input = menu.querySelector('input');
                const valor = parseInt(input.value, 10);
                if (valor > 0) {
                    nuevaFrecuencia = valor;
                }
            }

            if (nuevaFrecuencia !== null) {
                console.log(`[Properties] Cambiando frecuencia de tarea ${id} a ${nuevaFrecuencia}`);
                try {
                    const res = await enviarAjax('PUT', `/tareas/${id}/frecuencia`, {frecuencia: nuevaFrecuencia});
                    if (res.success) {
                        window.location.reload();
                    } else {
                        console.error(`[Properties] No se pudo cambiar la frecuencia:`, res.error);
                    }
                } catch (err) {
                    console.error(`[Properties] Error de red al cambiar frecuencia:`, err);
                }
                cerrarMenuAbierto();
            }
        });

        listenerDocumento = event => {
            if (!menu.contains(event.target) && event.target !== boton) {
                cerrarMenuAbierto();
            }
        };
        document.addEventListener('click', listenerDocumento);
    }

    // Añadir algunos estilos básicos para el menú contextual
    const style = document.createElement('style');
    style.textContent = `
        .menu-contextual {
            background: white;
            border: 1px solid #ccc;
            box-shadow: 0 2px 5px rgba(0,0,0,0.15);
            border-radius: 4px;
            padding: 5px 0;
            z-index: 1000;
        }
        .menu-contextual p {
            padding: 8px 15px;
            margin: 0;
            cursor: pointer;
        }
        .menu-contextual p:hover {
            background-color: #f0f0f0;
        }
        .frecuencia-personalizada {
            display: flex;
            padding: 5px;
            border-top: 1px solid #eee;
        }
        .frecuencia-personalizada input {
            width: 60px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }
        .frecuencia-personalizada button {
            border: 1px solid #ccc;
            background: #eee;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
})();
