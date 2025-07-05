// Módulo para archivar y desarchivar tareas
(function(){
    const listaTareas = document.getElementById('listaTareas');
    if(!listaTareas) return;

    listaTareas.addEventListener('click', async (e) => {
        if(e.target.classList.contains('btn-archivar')) {
            const li = e.target.closest('li.tarea');
            if(!li) return;
            const id = li.dataset.tarea;
            try {
                const res = await enviarAjax('POST', `/tareas/${id}/archivar`);
                if(res.success){
                    li.classList.toggle('archivado');
                } else {
                    alert(res.error || 'No se pudo archivar');
                }
            } catch(err){
                alert('Error de red');
            }
        }
    });
})(); 