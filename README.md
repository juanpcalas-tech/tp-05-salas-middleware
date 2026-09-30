# tp-05-salas-middleware


## Descripción
Este proyecto consiste en una aplicación web desarrollada en Node.js con Express + EJS para la gestión de "Reserva de Salas Estudio". Se agregan middlewares globales y de ruta para procesar de forma secuencial y persistencia temporal en memoria.


## Instalación
1. Clonar este repositorio en la máquina local:
   git clone + URL del proyecto
2. Inicializar Proyecto   
    npm init -y
3. Instala todas las dependencias requeridas:
   npm install express ejs express-ejs-layouts morgan
   
 
## Ejecución
  Se agrega linea "start": "node --watch src/index.js",  en package.json
  Se ejecuta en una Nueva Terminal el comando "npm start"

El servidor estará disponible en "http://localhost:3000".


## Rutas
La aplicación expone los siguientes endpoints y vistas:

    ### Vistas HTML de la Aplicación
    GET / -> Renderiza la vista "inicio" (pantalla de inicio).
    ******** Rutas Globales
        * `GET /` -> Renderiza la página de bienvenida (`inicio.ejs`).
        * `GET /estado` -> Devuelve un objeto JSON con el estado de salud del servidor y estadísticas de solicitudes.
        * `GET /api/reservas` -> API REST que retorna el listado completo de reservas en formato JSON.

    ******** Router de Reservas (`/reservas`)
        * `GET /reservas` -> Muestra el listado de todas las reservas efectuadas.
        * `GET /reservas/nueva` -> Renderiza el formulario para crear una nueva reserva.
        * `POST /reservas` -> Procesa el formulario, valida los datos y crea la reserva.
        * `GET /reservas/:id` -> Muestra el detalle específico de una reserva mediante su ID numérico.


## Pipeline de middleware

    ** Orden mínimo de dependencias:

    1- Morgan (tercero)
    2- identificarSolicitud (personalizado, global)
    3- medirDuracion (personalizado, global)
    4- expressLayouts (tercero)
    5- express.static (incorporado)
    6- express.urlencoded (incorporado)
    7- express.json (incorporado)
    8- Rutas de aplicación
    9- Router de reservas con middleware de área
    10- Página 404


## Alcance de cada Función

        Global: Morgan, identificarSolicitud, medirDuracion, expressLayouts, static, parsers.

        Router: prepararAreaReservas, validarReserva, crearReserva.

        Ruta específica: lógica de cada endpoint (/estado, /reservas/:id, etc.).

## Validación
El proceso de validación de "validarDatosReserva" comprueba estrictamente las siguientes condiciones:
    - Obligatoriedad: El nombre del "estudiante", "email" "fecha" no deben estar vacíos.
    - Estructura de Email: Debe contener obligatoriamente el carácter `@`.
    - Capacidad de personas: El número ingresado en "personas" debe ser un entero estrictamente mayor a "0" y menor o igual a "6".
    - Salas permitidas: Debe corresponder exclusivamente a ""Sala Norte"", ""Sala Sur"" o ""Sala Multimedia"".
    - Turnos permitidos: Debe corresponder exclusivamente a ""Mañana"", ""Tarde"" o ""Noche"".

    -- Si la validación falla: Se Interrumpe ejecucion devolviendo un estado "400 Error" y vuelve a renderizar la vista "reservas/nueva" inyectando un mensaje de error explícito y persistiendo los valores enviados previamente.


## Pruebas manuales
Para constatar el funcionamiento en tiempo de ejecución:
1. Prueba Flujo Exitoso: Dirígirse a "/reservas/nueva". Completa un registro con datos válidos (ej: 4 personas, Sala Norte, Turno Tarde,juan@gmail.com). El sistema procesará el envío, guardará el objeto y te redirigirá a la tabla "/reservas" mostrando el nuevo elemento al final de la lista. En consola se observará el log impreso por "medirDuracion".
2. Prueba Límite de Capacidad (Fallo): Intenta crear una reserva asignando 7 personas. El pipeline se detendrá en "validarDatosReserva", la respuesta retornará con código "400" y visualizara en pantalla el texto de error sin alterar la persistencia.


## Persistencia temporal
    Se implementa una estrategia de persistencia en memoria a través de un arreglo de objetos de JavaScript (`const reservas`). 

    Los nuevos registros empujados mediante "POST /reservas" se guardan únicamente dentro del arreglo en memoria volátil. Al no haber reescritura hacia el archivo físico en la función "crearReserva", cualquier detención, reinicio o fallo del proceso del servidor descartará los registros nuevos, restaurando los datos por defecto la próxima vez que se ejecute la rutina "main()".

*************************************************************************************************************************
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

    Todas las rutas definidas dentro de reservasRouter se vuelven relativas al camino (path) donde fue  montado. Express realiza una concatenación invisible (en este caso "reservasRouter"):
        El GET "/" del router se convierte en GET /reservas
        El GET "/nueva" del router se convierte en GET /reservas/nueva
        El POST "/" del router se convierte en POST /reservas
        El GET "/:id" del router se convierte en GET /reservas/:id

- diferencia entre el POST 302 y el GET posterior;
    El el POST cambia el estado del servidor (escribe datos), mientras que el GET posterior solo consulta el resultado actual (lee datos). Su objetivo principal es evitar que el usuario duplique datos (como una reserva) si recarga la página.
    
- motivo por el cual las altas desaparecen al reiniciar.
    Porque las crea en memoria y no las graba en el arreglo inicial.

## POST válido

POST /reservas
 → morgan("dev")
 → identificarSolicitud
 → medirDuracion
 → expressLayouts
 → express.urlencoded
 → reservasRouter
   → prepararAreaReservas
   → validarReserva
   → crearReserva
 → 302 /reservas
 → finish (ID, estado, duración)


## POST inválido
 POST /reservas
 → morgan("dev")
 → identificarSolicitud
 → medirDuracion
 → expressLayouts
 → express.urlencoded
 → reservasRouter
   → prepararAreaReservas
   → validarReserva
     ✖ termina aquí con 400 (mensaje de error, role="alert")