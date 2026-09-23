# tp-05-salas-middleware


## Descripción
Este proyecto consiste en una aplicación web desarrollada en **Node.js** utilizando el framework **Express** para la gestión de **Reserva de Salas Estudio**. Implementa una arquitectura basada en **middlewares** globales y de ruta para procesar de forma secuencial, auditable y segura las solicitudes HTTP entrantes.


## Instalación
1. Clona este repositorio en tu máquina local:
   git clone + URL del proyecto
2. Inicializar Proyecto   
    npm init -y
3. Instala todas las dependencias requeridas:
   npm install
 

## Ejecución
* Inicia el servidor de manera estándar.
  Se agrega linea "start": "node --watch src/index.js",  
  Se ejecuta en una Nueva Terminal el comando "npm start"

El servidor estará disponible en "http://localhost:3000".


## Rutas
La aplicación expone los siguientes endpoints y vistas:

    ### Vistas HTML de la Aplicación
    * **"GET /"** -> Renderiza la vista "comenzar" (pantalla de inicio del sistema).
    * **"GET /reservas"** -> Muestra la lista de reservas efectuadas ("reservas/listareservas").
    * **"GET /reservas/nuevareserva"** -> Renderiza el formulario para registrar una nueva reserva.
    * **"GET /reservas/:id"** -> Muestra el detalle específico de una reserva mediante su identificador.
    * **"POST /reservas"** -> Recibe el formulario, ejecuta la validación y crea la reserva.

    ### API de Datos
    * **"GET /api/reservas"** -> Retorna el listado completo de las reservas en formato JSON.

## Pipeline de middleware

    ### Flujo Post Válido
        A[POST /reservas] --> B[morgan 'dev']
        B --> C[identificarSolicitud]
        C --> D[medirDuracion]
        D --> E[expressLayouts]
        E --> F[express.urlencoded]
        F --> G[reservasRouter]
        G --> H[prepararAreaReservas]
        H --> I[validarDatosReserva]
        I --> J[crearReserva]
        J --> K[302 /reservas]
        K --> L[finish: ID + estado + duración]

## Alcance de cada función
* **"morgan("dev")"**: Loguea las peticiones HTTP entrantes en la consola con un formato simplificado de desarrollo.
* **"identificarSolicitud"**: Incrementa un contador global ("numeroDeSolicitud") y define un identificador único formateado (ej. "SOL-0001") guardándolo en "res.locals.solicitudId".
* **"medirDuracion"**: Toma una captura de tiempo de alta resolución con "process.hrtime.bigint()" e imprime en consola el ID, método, URL, código de respuesta y duración exacta en milisegundos tras activarse el evento "finish".
* **"expressLayouts"**: Gestiona las plantillas e inyecta las vistas solicitadas dentro del contenedor de diseño "layouts/main".
* **"express.urlencoded"**: Deserializa los datos enviados mediante formularios HTML a través del cuerpo de la petición ("req.body").
* **"reservasRouter"**: Enrutador de Express ("express.Router()") que encapsula y organiza todas las acciones bajo la ruta base "/reservas".
* **"prepararAreaReservas"**: Middleware a nivel de enrutador que inicializa la variable de contexto de la vista "res.locals.seccion" con la cadena ""Reserva de Salas Estudio"".
* **"validarDatosReserva"**: Intercepta los campos del formulario para realizar la lógica estricta de validación previa al almacenamiento.
* **"crearReserva"**: Controlador de fin de flujo. Calcula el nuevo identificador autoincremental analizando el arreglo actual, inserta el objeto validado y redirige al usuario mediante un código de estado "302".


## Validación
El proceso de validación alojado en **"validarDatosReserva"** comprueba estrictamente las siguientes condiciones de negocio:
1. **Obligatoriedad:** El nombre del "estudiante", "email" y "fecha" no deben estar vacíos.
2. **Capacidad de personas:** El número ingresado en "personas" debe ser un entero estrictamente mayor a "0" y menor o igual a "6".
3. **Salas permitidas:** Debe corresponder exclusivamente a ""Sala Norte"", ""Sala Sur"" o ""Sala Multimedia"".
4. **Turnos permitidos:** Debe corresponder exclusivamente a ""Mañana"", ""Tarde"" o ""Noche"".

* **Si la validación falla:** Interrumpe el pipeline devolviendo un estado "400 Bad Request" y vuelve a renderizar la vista "reservas/nuevareserva" inyectando un mensaje de error explícito y persistiendo los valores enviados previamente.


## Pruebas manuales
Para constatar el funcionamiento en tiempo de ejecución:
1. **Prueba Flujo Exitoso:** Dirígirse a "/reservas/nuevareserva". Completa un registro con datos válidos (ej: 4 personas, Sala Norte, Turno Tarde). El sistema procesará el envío, guardará el objeto y te redirigirá a la tabla "/reservas" mostrando el nuevo elemento al final de la lista. En consola se observará el log impreso por "medirDuracion".
2. **Prueba Límite de Capacidad (Fallo):** Intenta crear una reserva asignando 7 personas. El pipeline se detendrá en "validarDatosReserva", la respuesta retornará con código "400" y visualizarás en pantalla el texto de error sin alterar la persistencia.



## Persistencia temporal
La persistencia del sistema se comporta bajo una lógica mixta de carga persistente e inicialización en memoria:
Al iniciar la aplicación, la función asíncrona "leerJsonReservas(rutasReservas)" lee el archivo físico "reservasalas.json" y almacena los objetos iniciales dentro de un arreglo local en el servidor ("reservas").
Los nuevos registros empujados mediante "POST /reservas" se guardan únicamente dentro del arreglo en memoria volátil. Al no haber reescritura hacia el archivo físico en la función "crearReserva", cualquier detención, reinicio o fallo del proceso del servidor descartará los registros nuevos, restaurando los datos por defecto la próxima vez que se ejecute la rutina "main()".