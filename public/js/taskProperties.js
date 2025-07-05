// Módulo de Propiedades para cambiar prioridad y frecuencia de tareas
(function(){
    const listaTareas = document.getElementById('listaTareas');
    if(!listaTareas) return;

    // Interceptar clic secundario (contextmenu) sobre una tarea
    listaTareas.addEventListener('contextmenu', async (e) => {
        const li = e.target.closest('li.tarea');
        if(!li) return;
        e.preventDefault(); // Evitar menú del navegador

        const id = li.dataset.tarea;
        const accion = prompt("Cambiar propiedad:\n p = prioridad\n f = frecuencia\n (Cancelar para salir)");
        if(!accion) return;

        if(accion.toLowerCase() === 'p') {
            const nueva = prompt("Nueva prioridad (baja|media|alta|1-5):");
            if(!nueva) return;
            try {
                const res = await enviarAjax('PUT', `/tareas/${id}/prioridad`, { importancia: nueva });
                if(res.success){
                    alert('Prioridad actualizada');
                } else {
                    alert(res.error || 'Error al actualizar prioridad');
                }
            } catch(err) { alert('Error de red'); }
        } else if(accion.toLowerCase() === 'f') {
            const nueva = prompt("Nueva frecuencia (entero >=1):");
            if(!nueva) return;
            const frecuenciaInt = parseInt(nueva, 10);
            if(isNaN(frecuenciaInt) || frecuenciaInt <= 0) { alert('Número inválido'); return; }
            try {
                const res = await enviarAjax('PUT', `/tareas/${id}/frecuencia`, { frecuencia: frecuenciaInt });
                if(res.success){
                    alert('Frecuencia actualizada');
                } else {
                    alert(res.error || 'Error al actualizar frecuencia');
                }
            } catch(err) { alert('Error de red'); }
        }
    });
})(); 