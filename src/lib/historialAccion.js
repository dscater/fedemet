const pool = require('../database')
const historialAccion = {};

historialAccion.registraAccion = async (user_id, accion,descripcion,datos_original,datos_nuevo=null,modulo) =>{
    let nuevo_registro = {
        user_id:user_id,
        accion:accion,
        descripcion:descripcion,
        datos_original:JSON.stringify(datos_original),
        datos_nuevo: datos_nuevo? JSON.stringify(datos_nuevo):null,
        modulo:modulo,
        fecha:fechaActual(),
        hora:horaActual(),
    };

    await pool.query("INSERT INTO historial_accions SET ?",[nuevo_registro])
}

function fechaActual() {
    let date = new Date()

    let day = date.getDate()
    let month = date.getMonth() + 1
    let year = date.getFullYear()

    let fecha = '';
    if (month < 10) {
        fecha = `${year}-0${month}-${day}`;
    } else {
        fecha = `${year}-${month}-${day}`;
    }
    return fecha
}

function horaActual() {
    let date = new Date();

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    // Formateo para agregar un cero a la izquierda si es necesario
    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    if (seconds < 10) seconds = `0${seconds}`;

    return `${hours}:${minutes}:${seconds}`;
}

module.exports = historialAccion