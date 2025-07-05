<?php


namespace support;

/**
 * Class Response
 * @package support
 * @method static \Webman\Http\Response json(array|string $data = [], int $status = 200)
 */
class Response extends \Webman\Http\Response
{
    /**
     * Crea una respuesta JSON.
     * Este método existe principalmente para que los IDEs como Intelephense
     * puedan detectar su disponibilidad, ya que Webman define el helper en
     * tiempo de ejecución.
     *
     * @param array|string $data    Datos a serializar.
     * @param int          $status  Código HTTP.
     * @param array        $headers Encabezados adicionales.
     * @param int          $options Opciones de json_encode.
     *
     * @return \Webman\Http\Response
     */
    public static function json($data = [], int $status = 200, array $headers = [], int $options = JSON_UNESCAPED_UNICODE): \Webman\Http\Response
    {
        // Convertir los datos a JSON si es necesario
        if (is_array($data)) {
            $content = json_encode($data, $options);
        } else {
            $content = (string) $data;
        }

        // Asegurar el encabezado correcto
        $headers = array_merge(['Content-Type' => 'application/json'], $headers);

        return new static($content, $status, $headers);
    }
}