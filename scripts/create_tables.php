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

// --- Tabla Tareas ---
if ($schema->hasTable('tareas')) {
    $schema->drop('tareas');
    echo "[create_tables] Tabla 'tareas' existente eliminada.\n";
}

$schema->create('tareas', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('titulo');
    $table->string('importancia')->default('media');
    $table->integer('impnum')->default(2);
    $table->string('tipo')->default('una vez');
    $table->string('estado')->default('pendiente');
    $table->unsignedBigInteger('padre_id')->nullable();
    $table->string('seccion')->nullable();
    $table->integer('frecuencia')->default(1);
    $table->text('descripcion')->nullable();
    $table->date('fecha')->nullable();
    $table->date('fecha_limite')->nullable();
    $table->date('fecha_proxima')->nullable();
    $table->integer('veces_completado')->default(0);
    $table->json('fechas_completado')->nullable();
    $table->json('fechas_saltado')->nullable(); // Nuevo campo para hábitos
    $table->boolean('archivado')->default(false);

    $table->index('padre_id');
    $table->index('seccion');
    $table->index('estado');
    $table->index('tipo');

    $table->foreign('padre_id')->references('id')->on('tareas')->onDelete('cascade');
});
echo "[create_tables] Tabla 'tareas' creada/recreada correctamente.\n";


// --- Tabla Settings ---
if ($schema->hasTable('settings')) {
    $schema->drop('settings');
    echo "[create_tables] Tabla 'settings' existente eliminada.\n";
}

$schema->create('settings', function (Blueprint $table) {
    $table->string('key')->primary();
    $table->json('value')->nullable();
});

echo "[create_tables] Tabla 'settings' creada/recreada correctamente.\n";
