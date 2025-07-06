// public/js/taskDates.js
(function () {
    // Evitar que el script se ejecute múltiples veces
    if (window.taskDatesInitialized) {
        return;
    }
    window.taskDatesInitialized = true;

    console.log('[Raziel] Módulo de Fechas de Tarea inicializado.');

    const listaTareas = document.getElementById('listaTareas');
    let activeMenu = null; // Almacena el menú actualmente abierto (contextual o calendario)
    let globalClickListener = null; // Almacena el listener de clic global para cerrar menús

    /**
     * Cierra cualquier menú que esté actualmente activo y elimina su listener de clic.
     */
    function closeActiveMenu() {
        if (activeMenu) {
            activeMenu.remove();
            activeMenu = null;
        }
        if (globalClickListener) {
            document.removeEventListener('click', globalClickListener, true);
            globalClickListener = null;
        }
    }

    /**
     * Posiciona un elemento (menú o calendario) cerca de un elemento de anclaje.
     * @param {HTMLElement} element El elemento a posicionar.
     * @param {HTMLElement} anchor El elemento de referencia para la posición.
     */
    function positionElement(element, anchor) {
        const rect = anchor.getBoundingClientRect();
        element.style.position = 'absolute';
        element.style.top = `${window.scrollY + rect.bottom + 5}px`;
        element.style.left = `${window.scrollX + rect.left}px`;
        element.style.zIndex = '1100'; // z-index alto para estar sobre otros elementos
        document.body.appendChild(element);
        activeMenu = element;
    }

    // Listener principal delegado en la lista de tareas
    listaTareas.addEventListener('click', e => {
        const btnFechas = e.target.closest('.btn-gestionar-fechas');
        if (btnFechas) {
            e.stopPropagation();
            closeActiveMenu(); // Cierra cualquier otro menú primero
            showContextMenu(btnFechas);
        }
    });

    /**
     * Muestra el menú contextual para elegir el tipo de fecha a modificar.
     * @param {HTMLElement} button El botón de fechas que fue presionado.
     */
    function showContextMenu(button) {
        const li = button.closest('li.tarea');
        const esHabito = li.dataset.tipo.includes('habito');

        const menu = document.createElement('div');
        menu.className = 'menu-contextual';

        let menuHtml = `<p data-action="set-fecha" data-tipo="fecha_limite">Fecha Límite</p>`;
        if (esHabito) {
            menuHtml += `<p data-action="set-fecha" data-tipo="fecha_proxima">Fecha Próxima</p>`;
        }
        menu.innerHTML = menuHtml;

        positionElement(menu, button);

        menu.addEventListener('click', e => {
            e.stopPropagation();
            const target = e.target;
            if (target.dataset.action === 'set-fecha') {
                const tipoFecha = target.dataset.tipo;
                closeActiveMenu();
                showCalendar(button, li, tipoFecha);
            }
        });

        globalClickListener = event => {
            if (!menu.contains(event.target) && event.target !== button) {
                closeActiveMenu();
            }
        };
        setTimeout(() => document.addEventListener('click', globalClickListener, true), 0);
    }

    /**
     * Muestra un calendario dinámico para seleccionar una fecha.
     * @param {HTMLElement} anchor El elemento ancla para posicionar el calendario.
     * @param {HTMLElement} li El elemento <li> de la tarea.
     * @param {string} tipoFecha El tipo de fecha a modificar ('fecha_limite' o 'fecha_proxima').
     */
    function showCalendar(anchor, li, tipoFecha) {
        const tareaId = li.dataset.tareaId;
        const fechaActualISO = tipoFecha === 'fecha_limite' ? li.dataset.fechaLimite : li.dataset.fechaProxima;
        const fechaActual = fechaActualISO ? new Date(fechaActualISO + 'T00:00:00') : new Date();

        let currentMonth = fechaActual.getMonth();
        let currentYear = fechaActual.getFullYear();

        const calendarWrapper = document.createElement('div');
        calendarWrapper.className = 'menu-contextual raz-calendar';

        function render() {
            const primerDiaMes = new Date(currentYear, currentMonth, 1);
            const diasEnMes = new Date(currentYear, currentMonth + 1, 0).getDate();
            let diaSemanaPrimerDia = primerDiaMes.getDay();
            diaSemanaPrimerDia = diaSemanaPrimerDia === 0 ? 6 : diaSemanaPrimerDia - 1;

            const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

            calendarWrapper.innerHTML = `
                <div class="cal-nav">
                    <button class="cal-prev">&lt;</button>
                    <span class="cal-mes-anio">${meses[currentMonth]} ${currentYear}</span>
                    <button class="cal-next">&gt;</button>
                </div>
                <div class="cal-grid">
                    ${['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => `<b>${d}</b>`).join('')}
                    ${Array(diaSemanaPrimerDia).fill('<span></span>').join('')}
                    ${[...Array(diasEnMes).keys()].map(i => `<span class="cal-day">${i + 1}</span>`).join('')}
                </div>
                 <div class="cal-acciones">
                    <button class="cal-borrar">Borrar</button>
                    <button class="cal-hoy">Hoy</button>
                </div>
            `;

            calendarWrapper.querySelectorAll('.cal-day').forEach(dayEl => {
                dayEl.addEventListener('click', () => {
                    const dia = parseInt(dayEl.textContent, 10);
                    selectDate(new Date(currentYear, currentMonth, dia), tareaId, tipoFecha);
                });
            });

            calendarWrapper.querySelector('.cal-prev').addEventListener('click', () => {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                render();
            });
            calendarWrapper.querySelector('.cal-next').addEventListener('click', () => {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                render();
            });
            calendarWrapper.querySelector('.cal-hoy').addEventListener('click', () => selectDate(new Date(), tareaId, tipoFecha));
            calendarWrapper.querySelector('.cal-borrar').addEventListener('click', () => selectDate(null, tareaId, tipoFecha));
        }

        render();
        positionElement(calendarWrapper, anchor);

        globalClickListener = event => {
            if (!calendarWrapper.contains(event.target) && event.target !== anchor) {
                closeActiveMenu();
            }
        };
        setTimeout(() => document.addEventListener('click', globalClickListener, true), 0);
    }

    /**
     * Envía la fecha seleccionada al backend y actualiza la UI.
     * @param {Date|null} fecha La fecha seleccionada, o null para borrarla.
     * @param {string} tareaId El ID de la tarea.
     * @param {string} tipoFecha El campo de fecha a actualizar.
     */
    async function selectDate(fecha, tareaId, tipoFecha) {
        closeActiveMenu();
        const fechaISO = fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}` : null;

        try {
            const payload = {[tipoFecha]: fechaISO};
            await enviarAjax('PUT', `/tareas/${tareaId}`, payload);
            window.location.reload(); // Recargar la página para una actualización sencilla y robusta
        } catch (err) {
            alert('Error al actualizar la fecha: ' + (err.error || 'Error desconocido'));
            console.error(err);
        }
    }

    // Inyectar los estilos necesarios para el calendario y el menú contextual
    const style = document.createElement('style');
    style.textContent = `
        .menu-contextual { background: white; border: 1px solid #ccc; box-shadow: 0 2px 5px rgba(0,0,0,0.15); border-radius: 4px; padding: 5px; }
        .menu-contextual p { padding: 8px 12px; margin: 0; cursor: pointer; }
        .menu-contextual p:hover { background-color: #f0f0f0; }
        .raz-calendar .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
        .raz-calendar .cal-grid span, .raz-calendar .cal-grid b { padding: 5px; border-radius: 50%; }
        .raz-calendar .cal-grid span.cal-day { cursor: pointer; }
        .raz-calendar .cal-grid span.cal-day:hover { background-color: #e9e9e9; }
        .raz-calendar .cal-nav, .raz-calendar .cal-acciones { display: flex; justify-content: space-between; padding: 5px; align-items: center; }
        .raz-calendar .cal-nav button, .raz-calendar .cal-acciones button { background: none; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; }
        .raz-calendar .cal-nav button:hover, .raz-calendar .cal-acciones button:hover { background: #f0f0f0; }
    `;
    document.head.appendChild(style);
})();
