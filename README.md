# tp-05-salas-middleware


## Descripción
Este proyecto consiste en una aplicación web desarrollada en Node.js con Express para la gestión de "Reserva de Salas Estudio". Se agregan middlewares globales y de ruta para procesar de forma secuencial


## Instalación
1. Clonar este repositorio en tu máquina local:
   git clone + URL del proyecto
2. Inicializar Proyecto   
    npm init -y
3. Instala todas las dependencias requeridas:
   npm install
 

## Ejecución
  Iniciar el servidor de manera estándar.
  Se agrega linea "start": "node --watch src/index.js",  
  Se ejecuta en una Nueva Terminal el comando "npm start"

El servidor estará disponible en "http://localhost:3000".


## Rutas
La aplicación expone los siguientes endpoints y vistas:

    ### Vistas HTML de la Aplicación
    GET / -> Renderiza la vista "comenzar" (pantalla de inicio).
    ******** Rutas Globales
        * `GET /` -> Renderiza la página de bienvenida (`comenzar.ejs`).
        * `GET /estado` -> Devuelve un objeto JSON con el estado de salud del servidor y estadísticas de solicitudes.
        * `GET /api/reservas` -> API REST que retorna el listado completo de reservas en formato JSON.

    ******** Router de Reservas (`/reservas`)
        * `GET /reservas` -> Muestra el listado de todas las reservas efectuadas.
        * `GET /reservas/nueva` -> Renderiza el formulario para crear una nueva reserva.
        * `POST /reservas` -> Procesa el formulario, valida los datos y crea la reserva.
        * `GET /reservas/:id` -> Muestra el detalle específico de una reserva mediante su ID numérico.


## Pipeline de middleware

    [Cliente] 
        ──> identificarSolicitud ==> Asigna un identificador correlativo único (`BIB-XXXX`) a cada petición adjuntándolo a `res.locals`. 
        ──> medirDuracion ==> Registra el tiempo exacto en nanosegundos (`process.hrtime.bigint()`) cuando entra la petición y calcula los milisegundos  transcurridos una vez que el cliente recibe la respuesta (`res.on("finish")`).
        ──> Morgan ==> Registra en consola un log visual y rápido de los métodos HTTP solicitados.
        ──> Express Parsers (URL/JSON)  ==> Analizan y parsean los cuerpos de los formularios tradicionales o peticiones asíncronas HTTP, llenando `req.body`.
        ──> Router (prepararAreaReservas) ==> Middleware a nivel de Router que inyecta el nombre de la sección actual (`res.locals.seccion`) para uso dinámico de las vistas.
        ──> Crear Reserva ==> Controlador de fin de flujo. Calcula el nuevo identificador autoincremental analizando el arreglo actual, inserta 


## Alcance de cada Función
* `identificarSolicitud(req, res, next)`: Alcance global. Inicializa y propaga el ID de rastreo de auditoría.
* `medirDuracion(req, res, next)`: Alcance global. Monitorea el rendimiento del servidor e imprime métricas en consola.
* `prepararAreaReservas(req, res, next)`: Alcance local (`reservasRouter`). Configura variables contextuales de interfaz.
* `validarDatosReserva(req, res, next)`: Alcance de ruta (`POST /reservas`). Sanitiza los datos de entrada, comprueba reglas de negocio y decide si interrumpe o continúa el flujo.
* `crearReserva(req, res)`: Controlador final de la ruta `POST`. Calcula el ID autoincremental de forma segura y añade la reserva al arreglo.
* `main()`: Función asíncrona principal. Encapsula el arranque del servidor, inicializa la base de datos temporal, configura middlewares globales, define enrutadores y activa la escucha en el puerto de red.


## Validación
El proceso de validación de "validarDatosReserva" comprueba estrictamente las siguientes condiciones:
    - Obligatoriedad: El nombre del "estudiante", "email" "fecha" no deben estar vacíos.
    - Estructura de Email: Debe contener obligatoriamente el carácter `@`.
    - Capacidad de personas: El número ingresado en "personas" debe ser un entero estrictamente mayor a "0" y menor o igual a "6".
    - Salas permitidas: Debe corresponder exclusivamente a ""Sala Norte"", ""Sala Sur"" o ""Sala Multimedia"".
    - Turnos permitidos: Debe corresponder exclusivamente a ""Mañana"", ""Tarde"" o ""Noche"".

    -- Si la validación falla: Interrumpe el pipeline devolviendo un estado "400 Bad Request" y vuelve a renderizar la vista "reservas/nuevareserva" inyectando un mensaje de error explícito y persistiendo los valores enviados previamente.


## Pruebas manuales
Para constatar el funcionamiento en tiempo de ejecución:
1. Prueba Flujo Exitoso: Dirígirse a "/reservas/nueva". Completa un registro con datos válidos (ej: 4 personas, Sala Norte, Turno Tarde,juan@gmail.com). El sistema procesará el envío, guardará el objeto y te redirigirá a la tabla "/reservas" mostrando el nuevo elemento al final de la lista. En consola se observará el log impreso por "medirDuracion".
2. Prueba Límite de Capacidad (Fallo): Intenta crear una reserva asignando 7 personas. El pipeline se detendrá en "validarDatosReserva", la respuesta retornará con código "400" y visualizara en pantalla el texto de error sin alterar la persistencia.


## Persistencia temporal
    Se implementa una estrategia de persistencia en memoria a través de un arreglo de objetos de JavaScript (`const reservas`). 

    Los nuevos registros empujados mediante "POST /reservas" se guardan únicamente dentro del arreglo en memoria volátil. Al no haber reescritura hacia el archivo físico en la función "crearReserva", cualquier detención, reinicio o fallo del proceso del servidor descartará los registros nuevos, restaurando los datos por defecto la próxima vez que se ejecute la rutina "main()".

***********************************************************************************************************************************
Respuestas.

- diferencia entre middleware incorporado, de terceros y personalizado;
    Incorporado: Viene por defecto con node (ej express)
    De Terceros: Debe instalarse para poder ser usado (ej morgan)
    Propio: Funciones creadas por mi mismo en el codigo 

- cuándo se utiliza next() ;
    Cuando se debe ceder el control de la petición al siguiente middleware o ruta de la cadena para que no se quede colgado el sistema.

- por qué los parsers aparecen antes de la validación;
    Porque no se puede validar datos que el servidor aún no sabe leer, y los lee a traves del parseado o sea de transformar lo ingresado a .json

- diferencia entre alcance global, de router y de ruta;

    * Alcance Global: Afecta a absolutamente todas las solicitudes HTTP que entren a la aplicación, sin importar la URL o el método (GET, POST, etc.). (identificarSolicitud y medirDuracion)

    * Alcance de Router: Afecta únicamente a un grupo o módulo específico de rutas que comparten un prefijo común. No interfiere con el resto de la aplicación. Se monta sobre una instancia de express.Router() mediante router.use(). (Ej: prepararAreaReservas ) se ejecuta cuando alguien solicita una URL que empiece con /reservas (como /reservas, /reservas/nueva, etc.). No cuando se solicita /estado

    * Alcance de Ruta: Afecta de forma exclusiva y quirúrgica a un único endpoint específico (un método HTTP y una URL exacta).
    (Ej validarDatosReserva está acoplado únicamente a POST /reservas. No afecta al GET /reservas (el listado) ni al GET /reservas/nueva (el formulario en blanco), porque solo se necesita validar cuando el usuario envía los datos.)

- motivo del evento finish ;
    Medir el tiempo de respuesta de la peticion completa efectuada en la consulta

- resultado del montaje del router;

    Todas las rutas definidas dentro de reservasRouter se vuelven relativas al camino (path) donde decidiste montarlo. Express realiza una concatenación invisible:
        El GET "/" del router se convierte en GET /reservas
        El GET "/nueva" del router se convierte en GET /reservas/nueva
        El POST "/" del router se convierte en POST /reservas
        El GET "/:id" del router se convierte en GET /reservas/:id

- diferencia entre el POST 302 y el GET posterior;
    El el POST cambia el estado del servidor (escribe datos), mientras que el GET posterior solo consulta el resultado actual (lee datos). Su objetivo principal es evitar que el usuario duplique datos (como una reserva) si recarga la página.
    
- motivo por el cual las altas desaparecen al reiniciar.
    Porque las crea en memoria y no las graba en el arreglo inicial.