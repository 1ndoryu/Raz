// public/js/taskForm.js
const TaskForm = (function () {
    console.log('[Raziel] Módulo de Formulario de Tarea inicializado.');

    const state = {
        titulo: '',
        importancia: 'media',
        tipo: 'una vez',
        fechaLimite: null,
        seccion: ''
    };

    // Nodos del DOM
    const form = document.getElementById('formCrearTarea');
    const inputTitulo = form.querySelector('input[name="titulo"]');

    const sImportancia = document.getElementById('sImportancia');
    const menuImportancia = document.getElementById('menuImportancia');
    const labelImportancia = sImportancia.querySelector('.selector-label');

    const sTipo = document.getElementById('sTipo');
    const menuTipo = document.getElementById('menuTipo');
    const labelTipo = sTipo.querySelector('.selector-label');

    const sFechaLimite = document.getElementById('sFechaLimite');
    const labelFecha = sFechaLimite.querySelector('.selector-label');

    // Nodos del Calendario
    const calCont = document.getElementById('calCont');
    const calPrevBtn = document.getElementById('calPrev');
    const calNextBtn = document.getElementById('calNext');
    const calHoyBtn = document.getElementById('calHoyBtn');
    const calBorrarBtn = document.getElementById('calBorrarBtn');
    const calMesAnioEl = document.getElementById('calMesAnio');
    const calBodyEl = document.getElementById('calBody');
    const trDiasSemana = document.getElementById('calDiasSemana');

    const calNombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const calDiasSemanaCabecera = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
    let calMes, calAnio;
    let menuAbierto = null;

    function init() {
        if (!form) return;
        initSelector(sImportancia, menuImportancia, 'importancia', labelImportancia);
        initSelector(sTipo, menuTipo, 'tipo', labelTipo);
        initCalendario();
    }

    function initSelector(selectorEl, menuEl, stateKey, labelEl) {
        selectorEl.addEventListener('click', e => {
            e.stopPropagation();
            if (menuAbierto && menuAbierto !== menuEl) {
                menuAbierto.style.display = 'none';
            }
            const esVisible = menuEl.style.display === 'block';
            menuEl.style.display = esVisible ? 'none' : 'block';
            if (!esVisible) {
                menuAbierto = menuEl;
                // Posicionar menú
                const rect = selectorEl.getBoundingClientRect();
                menuEl.style.left = `${rect.left}px`;
                menuEl.style.top = `${rect.bottom + 5}px`;
            } else {
                menuAbierto = null;
            }
        });

        menuEl.addEventListener('click', e => {
            if (e.target.tagName === 'BUTTON') {
                e.stopPropagation();
                const valor = e.target.value;
                state[stateKey] = valor;
                labelEl.textContent = e.target.textContent;
                console.log(`[Form] Estado actualizado: ${stateKey} = ${valor}`);
                menuEl.style.display = 'none';
                menuAbierto = null;
            }
        });
    }

    function initCalendario() {
        if (trDiasSemana.innerHTML === '') {
            calDiasSemanaCabecera.forEach(dia => {
                const th = document.createElement('th');
                th.textContent = dia;
                trDiasSemana.appendChild(th);
            });
        }

        sFechaLimite.addEventListener('click', e => {
            e.stopPropagation();
            if (menuAbierto && menuAbierto !== calCont) {
                menuAbierto.style.display = 'none';
            }
            const esVisible = calCont.style.display === 'block';
            if (esVisible) {
                calCont.style.display = 'none';
                menuAbierto = null;
            } else {
                mostrarCal(sFechaLimite);
            }
        });

        calPrevBtn.onclick = () => {
            calMes--;
            if (calMes < 0) {
                calMes = 11;
                calAnio--;
            }
            renderCal();
        };
        calNextBtn.onclick = () => {
            calMes++;
            if (calMes > 11) {
                calMes = 0;
                calAnio++;
            }
            renderCal();
        };
        calHoyBtn.onclick = () => seleccionarFecha(new Date());
        calBorrarBtn.onclick = () => seleccionarFecha(null);
    }

    function mostrarCal(elementoRef) {
        const rect = elementoRef.getBoundingClientRect();
        calCont.style.top = rect.bottom + 5 + 'px';
        calCont.style.left = rect.left + 'px';

        const fechaActual = state.fechaLimite ? new Date(state.fechaLimite + 'T00:00:00') : new Date();
        calAnio = fechaActual.getFullYear();
        calMes = fechaActual.getMonth();

        calCont.style.display = 'block';
        menuAbierto = calCont;
        renderCal();
    }

    function renderCal() {
        calMesAnioEl.textContent = `${calNombresMeses[calMes]} ${calAnio}`;
        calBodyEl.innerHTML = '';
        const primerDiaMes = new Date(calAnio, calMes, 1);
        const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();
        let diaSemanaPrimerDia = primerDiaMes.getDay();
        diaSemanaPrimerDia = diaSemanaPrimerDia === 0 ? 6 : diaSemanaPrimerDia - 1;

        const hoy = new Date();
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        let fechaActualDia = 1;
        for (let i = 0; i < 6; i++) {
            const fila = document.createElement('tr');
            for (let j = 0; j < 7; j++) {
                const celda = document.createElement('td');
                const divDia = document.createElement('div');
                divDia.classList.add('cal-dia');

                if ((i === 0 && j < diaSemanaPrimerDia) || fechaActualDia > diasEnMes) {
                    divDia.classList.add('cal-dia-fuera');
                } else {
                    divDia.textContent = fechaActualDia;
                    const fechaCompleta = new Date(calAnio, calMes, fechaActualDia);
                    const fechaCompletaStr = `${calAnio}-${String(calMes + 1).padStart(2, '0')}-${String(fechaActualDia).padStart(2, '0')}`;

                    if (fechaCompletaStr === hoyStr) divDia.classList.add('cal-dia-hoy');
                    if (state.fechaLimite === fechaCompletaStr) divDia.classList.add('cal-dia-sel');

                    celda.onclick = () => seleccionarFecha(fechaCompleta);
                    fechaActualDia++;
                }
                celda.appendChild(divDia);
                fila.appendChild(celda);
            }
            calBodyEl.appendChild(fila);
            if (fechaActualDia > diasEnMes) break;
        }
    }

    function seleccionarFecha(fecha) {
        if (fecha instanceof Date) {
            state.fechaLimite = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
            labelFecha.textContent = `🗓️ ${state.fechaLimite.substring(8, 10)}/${state.fechaLimite.substring(5, 7)}`;
        } else {
            state.fechaLimite = null;
            labelFecha.textContent = '🗓️ Fecha';
        }
        console.log(`[Form] Estado actualizado: fechaLimite = ${state.fechaLimite}`);
        calCont.style.display = 'none';
        menuAbierto = null;
    }

    document.addEventListener('click', e => {
        if (menuAbierto && !menuAbierto.contains(e.target)) {
            const esSelector = e.target.closest('.form-selector');
            if (!esSelector || (esSelector.id !== sImportancia.id && esSelector.id !== sTipo.id && esSelector.id !== sFechaLimite.id)) {
                menuAbierto.style.display = 'none';
                menuAbierto = null;
            }
        }
    });

    init();

    // API pública del módulo
    return {
        getDatos: () => {
            state.titulo = inputTitulo.value.trim();
            return {...state};
        },
        limpiar: () => {
            inputTitulo.value = '';
            state.titulo = '';
            // Opcional: resetear otros estados a sus valores por defecto si se necesita
        }
    };
})();
