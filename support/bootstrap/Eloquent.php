<?php

namespace support\bootstrap;

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Events\Dispatcher;
use Illuminate\Container\Container;
use Webman\Bootstrap;

class Eloquent implements Bootstrap
{
    /**
     * Inicializa y registra el ORM Eloquent.
     * Este método es invocado automáticamente por Webman al arrancar.
     *
     * @param \Workerman\Worker|null $worker
     * @return void
     */
    public static function start($worker)
    {
        // Configuración obtenida del archivo config/database.php
        $config     = config('database');
        $connection = $config['connections'][$config['default']] ?? null;

        if (!$connection) {
            echo "[Eloquent] Configuración de base de datos no encontrada.\n";
            return;
        }

        $capsule = new Capsule();
        $capsule->setEventDispatcher(new Dispatcher(new Container()));
        $capsule->addConnection($connection);

        // Hacer disponible globalmente y arrancar Eloquent
        $capsule->setAsGlobal();
        $capsule->bootEloquent();

        echo "[Eloquent] ORM inicializado correctamente.\n";
    }
} 