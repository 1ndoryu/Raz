<?php

namespace app\model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Tarea extends Model
{
    // Nombre de la tabla
    protected $table = 'tareas';

    // Atributos asignables masivamente
    protected $fillable = [
        'titulo',
        'importancia',
        'impnum',
        'tipo',
        'estado',
        'padre_id',
        'seccion',
        'frecuencia',
        'descripcion',
        'fecha',
        'fecha_limite',
        'fecha_proxima',
        'veces_completado',
        'fechas_completado',
        'fechas_saltado', // Nuevo campo
        'archivado',
    ];

    // Conversiones de tipo para atributos
    protected $casts = [
        'archivado'         => 'boolean',
        'fechas_completado' => 'array',
        'fechas_saltado'    => 'array', // Nuevo cast
        'frecuencia'        => 'integer',
        'veces_completado'  => 'integer',
        'impnum'            => 'integer',
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

    /**
     * Accesor para obtener el valor numérico de la importancia.
     * Esto permite que $tarea->impnum funcione sin tener que calcularlo manualmente.
     */
    protected function impnum(): Attribute
    {
        return Attribute::make(
            get: fn ($value, $attributes) => match ($attributes['importancia']) {
                'importante' => 4,
                'alta' => 3,
                'media' => 2,
                'baja' => 1,
                default => 2,
            },
        );
    }
}