<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

// Cargar la configuración de la base de datos de Webman
$config     = require __DIR__ . '/../config/database.php';
$connection = $config['connections'][$config['default']] ?? null;

if (!$connection) {
    fwrite(STDERR, "[create_tables] Configuración de base de datos no encontrada.\n");
    exit(1);
}

$capsule = new Capsule();
$capsule->addConnection($connection);
$capsule->setAsGlobal();
$capsule->bootEloquent();

$schema = Capsule::schema();

// --- INICIO DE MODIFICACIÓN ---
// Eliminar la tabla si ya existe para asegurar una recreación limpia
if ($schema->hasTable('tareas')) {
    $schema->drop('tareas');
    echo "[create_tables] Tabla 'tareas' existente eliminada.\n";
}
// --- FIN DE MODIFICACIÓN ---

// Crear tabla 'tareas' si no existe
if (!$schema->hasTable('tareas')) {
    $schema->create('tareas', function (Blueprint $table) {
        $table->bigIncrements('id');
        $table->string('titulo');
        $table->string('importancia')->default('media');
        $table->integer('impnum')->default(2); // Valor numérico para ordenar por importancia
        $table->string('tipo')->default('una vez');
        $table->string('estado')->default('pendiente');
        $table->unsignedBigInteger('padre_id')->nullable();
        $table->string('seccion')->nullable();
        $table->integer('frecuencia')->default(1);
        $table->text('descripcion')->nullable();
        $table->date('fecha')->nullable(); // Fecha de creación o último completado
        $table->date('fecha_limite')->nullable(); // Para metas
        $table->date('fecha_proxima')->nullable(); // Para hábitos
        $table->integer('veces_completado')->default(0);
        $table->json('fechas_completado')->nullable(); // Historial de fechas de hábitos
        $table->boolean('archivado')->default(false);

        // Índices
        $table->index('padre_id');
        $table->index('seccion');
        $table->index('estado');
        $table->index('tipo');

        // Clave foránea a si misma
        $table->foreign('padre_id')->references('id')->on('tareas')->onDelete('cascade');
    });

    echo "[create_tables] Tabla 'tareas' creada correctamente con todos los campos.\n";
} else {
    echo "[create_tables] La tabla 'tareas' ya existe, nada que hacer.\n";
}