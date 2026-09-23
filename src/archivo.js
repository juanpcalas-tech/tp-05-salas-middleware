const fs = require("node:fs/promises");

async function leerJsonReservas(rutaDatosReserva) {
    try {
        const reservas = await fs.readFile(rutaDatosReserva, "utf-8");
        return JSON.parse(reservas);

    } catch (error) {
        throw new Error(`El archivo ${rutaDatosReserva} no existe.`);
    }
}

module.exports = {
    leerJsonReservas,
};