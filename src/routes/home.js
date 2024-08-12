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
    let usuarios = await pool.query("SELECT COUNT(*) as cantidad FROM users WHERE tipo IN ('ADMINISTRADOR')");
    usuarios = usuarios[0].cantidad;

    let doctors = 0;

    let especialidads = 0;

    let tipo_usuario = req.user.tipo;

    let pacientes = 0;

    let citas = 0;
    let citas_proximas = [];

    consultas = 0;
    lista_citas = null;


    pacientes = 0;

    let notifica = false;
    let muestra_notificacion = false;

    res.render('home', {
        pagina,
        usuarios: usuarios,
        doctors: doctors,
        especialidads: especialidads,
        pacientes: pacientes,
        citas: citas,
        citas_proximas: citas_proximas,
        consultas: consultas,
        notifica: notifica,
        notifica:notifica,
        muestra_notificacion:muestra_notificacion,
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