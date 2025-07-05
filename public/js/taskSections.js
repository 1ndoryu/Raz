// public/js/taskSections.js
(function () {
    console.log('[Raziel] Módulo de Secciones inicializado.');
    const listaTareas = document.getElementById('listaTareas');
    if (!listaTareas) {
        console.error('[Sections] Contenedor de lista de tareas no encontrado.');
        return;
    }

    listaTareas.addEventListener('click', e => {
        if (e.target.tagName === 'H2' && e.target.closest('.seccion-container')) {
            activarEdicionTituloSeccion(e.target);
        }
    });

    function activarEdicionTituloSeccion(h2) {
        const seccionContainer = h2.closest('.seccion-container');
        if (!seccionContainer) return;

        const nombreOriginal = seccionContainer.dataset.seccionNombre;
        const listaUl = h2.nextElementSibling;

        if (nombreOriginal === 'General' || (listaUl && listaUl.children.length === 0)) {
            console.log(`[Sections] La sección "${nombreOriginal}" no es editable.`);
            return;
        }
        if (h2.isContentEditable) return;

        console.log(`[Sections] Activando edición para sección "${nombreOriginal}"`);
        h2.contentEditable = 'true';
        h2.focus();
        document.execCommand('selectAll', false, null);

        const guardarCambios = async () => {
            h2.contentEditable = 'false';
            const nombreNuevo = h2.textContent.trim();

            h2.removeEventListener('blur', guardarCambios);
            h2.removeEventListener('keydown', manejarTeclas);

            if (nombreNuevo === '' || nombreNuevo === nombreOriginal) {
                h2.textContent = nombreOriginal;
                console.log('[Sections] Edición cancelada o sin cambios.');
                return;
            }

            console.log(`[Sections] Renombrando sección de "${nombreOriginal}" a "${nombreNuevo}"`);
            try {
                const respuesta = await enviarAjax('PUT', `/secciones`, { nombreOriginal, nombreNuevo });
                if (respuesta.success) {
                    console.log(`[Sections] API success: Sección renombrada.`);
                    seccionContainer.dataset.seccionNombre = nombreNuevo;
                } else {
                    console.error(`[Sections] Error al renombrar: ${respuesta.error}`);
                    h2.textContent = nombreOriginal;
                }
            } catch (err) {
                console.error('[Sections] Error de red:', err);
                h2.textContent = nombreOriginal;
            }
        };

        const manejarTeclas = e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                h2.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                h2.textContent = nombreOriginal;
                h2.blur();
            }
        };

        h2.addEventListener('blur', guardarCambios);
        h2.addEventListener('keydown', manejarTeclas);
    }
})();