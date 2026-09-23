const path = require("node:path");
const express = require("express");
const morgan = require("morgan");
const { leerJsonReservas } = require("./archivo");
const expressLayouts = require("express-ejs-layouts");
const rutasReservas = path.join(__dirname, "..", "datos", "reservasalas.json");

let numeroDeSolicitud = 0;
function identificarSolicitud(req, res, next) {
    numeroDeSolicitud += 1;
    res.locals.solicitudId = `SOL-${String(numeroDeSolicitud).padStart(4, "0")}`;
    next();
}

function medirDuracion(req, res, next) {
    const inicio = process.hrtime.bigint();
    res.on("finish", () => {
        const fin = process.hrtime.bigint();
        const milisegundos = Number(fin - inicio) / 1_000_000;
        console.log(
            `[${res.locals.solicitudId}] ${req.method} ${req.originalUrl} ` +
            `${res.statusCode} ${milisegundos.toFixed(2)} ms`,
        );
    });
    next();
}

function prepararAreaReservas(req, res, next) {
    res.locals.seccion = "Reserva de Salas Estudio";
    next();
}
function validarDatosReserva(req, res, next) {
    const estudiante = String(req.body.estudiante ?? "").trim();
    const email = String(req.body.email ?? "").trim();
    const fecha = String(req.body.fecha ?? "").trim();
    const personas = Number(req.body.personas?.trim());
    const salasDisponibles = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
    const turnosDisponibles = ["Mañana", "Tarde", "Noche"];
    const DatosValidos = estudiante && email && fecha && turnosDisponibles.includes(req.body.turno) && salasDisponibles.includes(req.body.sala) && Number.isInteger(personas) && personas > 0 && personas <= 6;
    if (!DatosValidos) {
        return res.status(400).render("reservas/nuevareserva", {
            titulodetalle: "Nueva Reserva",
            error: "Datos inválidos. Por favor, complete todos los campos correctamente.",
            reserva: req.body
        })
    }
    req.salavalidada = {
        estudiante,
        email,
        fecha,
        turno: req.body.turno,
        sala: req.body.sala,
        personas
    };
    next();
}
function crearReserva(req, res) {
    const ultimoId = reservas.reduce(
        (mayorId, reserva) => Math.max(mayorId, reserva.id),
        0,
    );
    reservas.push({ id: ultimoId + 1, ...req.reservaValidada });
    res.redirect("/reservas");
}


async function main() {
    const PORT = 3000;
    const app = express();
    const reservas = await leerJsonReservas(rutasReservas);

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "..", "views"));
    app.set("layout", "layouts/main");
    app.use(morgan("dev"));

    app.use(identificarSolicitud);
    app.use(medirDuracion);
    app.use(expressLayouts);
    app.use(express.static(path.join(__dirname, "..", "public")));

    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    app.get("/", (req, res) => {
        res.render("comenzar", { titulodetalle: "Reserva Salas Estudio" });
    });
    app.get("/api/reservas", (req, res) => {
        res.json(reservas);
    });

    const reservasRouter = express.Router();
    reservasRouter.use(prepararAreaReservas);


    reservasRouter.get("/", (req, res) => {
        res.render("reservas/listareservas", {
            titulodetalle: "Reservas Efectuadas",
            reservas,
        });
    });

    reservasRouter.get("/nuevareserva", (req, res) => {
        res.render("reservas/nuevareserva", {
            titulodetalle: "Nueva Reserva",
            error: null,
            valores: {},
        });
    });

    reservasRouter.get("/:id", (req, res) => {
        const id = Number(req.params.id);
        const reserva = reservas.find((elemento) => elemento.id === id);
        if (!reserva) {
            return res.status(404).render("no_encontrado", {
                titulodetalle: "No encontrada",
                mensaje: "No existe un Reserva con ese identificador.",
            });
        }

        res.render("reservas/listareservas", {
            titulodetalle: reserva.estudiante,
            reserva,
        });
    });

    reservasRouter.post("/", validarDatosReserva, crearReserva);
    app.use("/reservas", reservasRouter);


        
        app.use((req, res) => {
            res.status(404).render("no-encontrado", {
                titulodetalle: "Página no encontrada",
                mensaje: "La dirección solicitada no existe.",
            });
        });
    

    app.listen(PORT, () => {
        console.log(`Servidor corriendo Correctamente en http://localhost:${PORT}`);
    });
};
main(); 
