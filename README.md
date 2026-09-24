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
    GET /reservas -> Muestra la lista de reservas efectuadas ("reservas/listareservas").
    GET /reservas/nuevareserva -> Renderiza el formulario para registrar una nueva reserva.
    GET /reservas/:id -> Muestra el detalle específico de una reserva mediante su identificador.
    GET /api/reservas -> Retorna el listado completo de las reservas en formato JSON.
    POST /reservas -> Recibe el formulario, ejecuta la validación y crea la reserva.


## Pipeline de middleware

    ### Flujo Post Válido
        1. POST /reservas 
        morgan 'dev'            --Middlewares de terceros Registra peticiones HTTP y muestra resumen en consola
        2. identificarSolicitud --Incrementa un contador global ("numeroDeSolicitud") y define un identificador único formateado (ej.         "BIB-0001")   guardándolo en "res.locals.solicitudId".
        3. medirDuracion
        4. expressLayouts          --Gestiona las plantillas e inyecta las vistas solicitadas dentro del contenedor de diseño "layouts/main"
        5. express.urlencoded      --procesar los datos que se envían a través de formularios HTML..
        6. reservasRouter          --Enrutador de Express ("express.Router()") que encapsula y organiza todas las acciones bajo la ruta base "/reservas".
        7. prepararAreaReservas    --Middleware propio que inicializa la variable "res.locals.seccion" con la cadena ""Reserva de Salas Estudio"". 
        8. validarDatosReserva     --Intercepta los campos del formulario para realizar la lógica estricta de validación previa al almacenamiento.
        9. crearReserva            --Controlador de fin de flujo. Calcula el nuevo identificador autoincremental analizando el arreglo actual, inserta el objeto validado 
        10. 302 /reservas           --Codigo de creacion de Reserva


## Validación
El proceso de validación alojado en "validarDatosReserva" comprueba estrictamente las siguientes condiciones:
1. Obligatoriedad: El nombre del "estudiante", "email" "fecha" no deben estar vacíos.
2. Capacidad de personas: El número ingresado en "personas" debe ser un entero estrictamente mayor a "0" y menor o igual a "6".
3. Salas permitidas: Debe corresponder exclusivamente a ""Sala Norte"", ""Sala Sur"" o ""Sala Multimedia"".
4. Turnos permitidos: Debe corresponder exclusivamente a ""Mañana"", ""Tarde"" o ""Noche"".

5. Si la validación falla: Interrumpe el pipeline devolviendo un estado "400 Bad Request" y vuelve a renderizar la vista "reservas/nuevareserva" inyectando un mensaje de error explícito y persistiendo los valores enviados previamente.


## Pruebas manuales
Para constatar el funcionamiento en tiempo de ejecución:
1. Prueba Flujo Exitoso: Dirígirse a "/reservas/nuevareserva". Completa un registro con datos válidos (ej: 4 personas, Sala Norte, Turno Tarde). El sistema procesará el envío, guardará el objeto y te redirigirá a la tabla "/reservas" mostrando el nuevo elemento al final de la lista. En consola se observará el log impreso por "medirDuracion".
2. Prueba Límite de Capacidad (Fallo): Intenta crear una reserva asignando 7 personas. El pipeline se detendrá en "validarDatosReserva", la respuesta retornará con código "400" y visualizara en pantalla el texto de error sin alterar la persistencia.


## Persistencia temporal
La persistencia del sistema se comporta bajo una lógica mixta de carga persistente e inicialización en memoria:
Al iniciar la aplicación, la función asíncrona "leerJsonReservas(rutasReservas)" lee el archivo físico "reservasalas.json" y almacena los objetos iniciales dentro de un arreglo local en el servidor ("reservas").
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

- motivo del evento finish ;
    Medir el tiempo de respuesta de la peticion completa efectuada en la consulta

- resultado del montaje del router;

- diferencia entre el POST 302 y el GET posterior;

- motivo por el cual las altas desaparecen al reiniciar.
    Porque las crea en memoria y no las graba en el arreglo inicial.