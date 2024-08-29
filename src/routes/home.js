const express = require('express');
const {
    isLoggedIn
} = require('../lib/auth');
const router = express.Router();

const pool = require('../database');

router.get('/', isLoggedIn, async (req, res) => {
    pagina = {};
    pagina.actual = 'home'

    // VALORES
    let usuarios = await pool.query("SELECT COUNT(*) as cantidad FROM users WHERE id != 1 AND estado = 1");
    usuarios = usuarios[0].cantidad;

    let ventas = await pool.query("SELECT COUNT(*) as cantidad FROM ventas WHERE estado = 1");
    ventas = ventas[0].cantidad;

    let productos = await pool.query("SELECT COUNT(*) as cantidad FROM productos WHERE estado = 1");
    productos = productos[0].cantidad;

    let clientes = await pool.query("SELECT COUNT(*) as cantidad FROM clientes WHERE estado = 1");
    clientes = clientes[0].cantidad;

    res.render('home', {
        pagina,
        usuarios,
        ventas,
        productos,
        clientes
    });
});
module.exports = router;

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