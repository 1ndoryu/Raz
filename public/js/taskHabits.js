// public/js/taskHabits.js
(function () {
    console.log('[Raziel] Módulo de Hábitos inicializado.');

    const listaTareasContainer = document.getElementById('listaTareas');
    if (!listaTareasContainer) {
        console.error('[Habits] Contenedor de lista de tareas no encontrado.');
        return;
    }

    /**
     * Maneja el clic en un cuadrado de seguimiento de hábito.
     * @param {MouseEvent} e El evento de clic.
     */
    async function manejarClicDiaHabito(e) {
        const itemDia = e.target.closest('.dia-habito-item');
        if (!itemDia) return;

        e.stopPropagation(); // Evitar que otros listeners de la tarea se disparen

        const tareaLi = itemDia.closest('li.tarea');
        const tareaId = tareaLi.dataset.tareaId;
        const fecha = itemDia.dataset.fecha;
        const estadoActual = itemDia.dataset.estado;

        // Ciclo de estados: pendiente -> completado -> saltado -> pendiente
        let estadoNuevo;
        if (estadoActual === 'pendiente') {
            estadoNuevo = 'completado';
        } else if (estadoActual === 'completado') {
            estadoNuevo = 'saltado';
        } else {
            // 'saltado'
            estadoNuevo = 'pendiente';
        }

        console.log(`[Habits] Tarea ${tareaId}, Fecha ${fecha}. Cambio de '${estadoActual}' a '${estadoNuevo}'.`);

        try {
            // Llama al nuevo endpoint del backend
            const respuesta = await enviarAjax('POST', `/tareas/${tareaId}/marcar-dia`, {
                fecha: fecha,
                estado: estadoNuevo
            });

            if (respuesta.success) {
                console.log(`[Habits] Tarea ${tareaId} actualizada. Actualizando vista.`);
                const tareaActualizada = respuesta.data;
                actualizarVistaHabito(tareaLi, tareaActualizada);
            } else {
                console.error(`[Habits] Error al marcar día para tarea ${tareaId}:`, respuesta.error);
                alert(`Error: ${respuesta.error}`);
            }
        } catch (err) {
            console.error('[Habits] Error de red al marcar día:', err);
            alert(`Error de red: ${err.error || 'No se pudo conectar con el servidor.'}`);
        }
    }

    /**
     * Actualiza la vista de una tarea de hábito con los nuevos datos.
     * @param {HTMLElement} tareaLi El elemento <li> de la tarea.
     * @param {object} datosTarea Los datos actualizados de la tarea desde el backend.
     */
    function actualizarVistaHabito(tareaLi, datosTarea) {
        // Actualizar el visualizador de días
        const visualizador = tareaLi.querySelector('.habito-dias-visualizacion');
        if (visualizador) {
            const fechasCompletado = datosTarea.fechas_completado || [];
            const fechasSaltado = datosTarea.fechas_saltado || [];

            visualizador.querySelectorAll('.dia-habito-item').forEach(itemDia => {
                const fecha = itemDia.dataset.fecha;
                let estadoNuevo = 'pendiente';
                let claseNueva = 'estado-pendiente';

                if (fechasCompletado.includes(fecha)) {
                    estadoNuevo = 'completado';
                    claseNueva = 'estado-completado';
                } else if (fechasSaltado.includes(fecha)) {
                    estadoNuevo = 'saltado';
                    claseNueva = 'estado-saltado';
                }

                itemDia.dataset.estado = estadoNuevo;
                itemDia.className = `dia-habito-item ${claseNueva}`;
            });
        }

        // Actualizar la fecha próxima si es relevante para la vista
        if (datosTarea.fecha_proxima) {
            tareaLi.dataset.fechaProxima = datosTarea.fecha_proxima;
        }

        console.log(`[Habits] Vista de tarea ${datosTarea.id} actualizada en el DOM.`);
    }

    listaTareasContainer.addEventListener('click', manejarClicDiaHabito);
})();
