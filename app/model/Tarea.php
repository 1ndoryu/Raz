<?php

namespace app\model;

use Illuminate\Database\Eloquent\Model;

class Tarea extends Model
{
    // Nombre de la tabla
    protected $table = 'tareas';

    // Atributos asignables masivamente
    protected $fillable = [
        'titulo',
        'importancia',
        'tipo',
        'estado',
        'padre_id',
        'sesion',
        'frecuencia',
        'descripcion',
        'fecha',
        'archivado',
    ];

    // Deshabilitar timestamps si la tabla no los utiliza
    public $timestamps = false;

    /**
     * Relación con la tarea padre.
     */
    public function padre()
    {
        return $this->belongsTo(self::class, 'padre_id');
    }

    /**
     * Relación con las subtareas.
     */
    public function subtareas()
    {
        return $this->hasMany(self::class, 'padre_id');
    }
} 