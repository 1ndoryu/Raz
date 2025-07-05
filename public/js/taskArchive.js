// public/js/taskArchive.js
(function() {
    console.log('[Raziel] Módulo de Archivo inicializado.');
    const listaTareas = document.getElementById('listaTareas');
    if (!listaTareas) {
        console.error('[Archive] Contenedor de lista de tareas no encontrado.');
        return;
    }

    listaTareas.addEventListener('click', async (e) => {
        const btnArchivar = e.target.closest('.btn-archivar');
        if (btnArchivar) {
            const li = btnArchivar.closest('li.tarea');
            if (!li) return;
            
            const id = li.dataset.tareaId;
            console.log(`[Archive] Intentando archivar/desarchivar tarea ${id}`);
            
            try {
                const res = await enviarAjax('POST', `/tareas/${id}/archivar`);
                if (res.success) {
                    li.classList.toggle('archivado');
                    console.log(`[Archive] Tarea ${id} actualizada al estado: ${res.data.estado}`);
                } else {
                    console.error(`[Archive] No se pudo archivar la tarea ${id}:`, res.error || 'Error desconocido.');
                }
            } catch (err) {
                console.error(`[Archive] Error de red al archivar la tarea ${id}:`, err);
            }
        }
    });
})();