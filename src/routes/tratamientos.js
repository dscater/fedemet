const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    const { id } = req.params;
    const seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [id]);
    const seguimiento = seguimientos[0];
    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [seguimiento.paciente_id]);
    let paciente = pacientes[0];
    seguimiento.paciente = paciente;

    let users = await pool.query("SELECT * FROM users WHERE id = ?", [seguimiento.paciente.user_id]);
    let user = users[0];
    seguimiento.paciente.user = user;

    const tratamientos = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM tratamientos WHERE seguimiento_id = ?",[seguimiento.id]);

    res.render('tratamientos/index', { tratamientos: tratamientos, seguimiento, pagina });
});

router.get('/create/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    const { id } = req.params;
    const seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [id]);
    const seguimiento = seguimientos[0];

    let fecha = fechaActual();
    let hora =horaActual();
    res.render('tratamientos/create', { pagina: pagina, seguimiento , fecha:fecha, hora:hora});
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    let nuevo = {
        seguimiento_id: req.body.seguimiento_id,
        subjetivo: req.body.subjetivo.toUpperCase(),
        objetivo: req.body.objetivo.toUpperCase(),
        diagnostico: req.body.diagnostico.toUpperCase(),
        tratamiento: req.body.tratamiento.toUpperCase(),
        fecha: req.body.fecha,
        hora: req.body.hora,
        edad: req.body.edad,
        peso: req.body.peso,
        imc: req.body.imc,
        pa: req.body.pa,
        fc: req.body.fc,
        fr: req.body.fr,
        temperatura: req.body.temperatura,
    };

    let result = await pool.query("INSERT INTO tratamientos SET ?", [nuevo]);
    let nuevo_registro = result.insertId;
    req.flash('success', 'Registro éxitoso')
    return res.redirect('/tratamientos/'+nuevo.seguimiento_id);
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';
    const { id } = req.params;
    const tratamientos = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM tratamientos WHERE id = ?", [id]);
    const tratamiento = tratamientos[0];

    let seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [tratamiento.seguimiento_id]);
    let seguimiento = seguimientos[0];
    tratamiento.seguimiento = seguimiento;

    res.render('tratamientos/edit', { pagina: pagina, tratamiento: tratamiento });
});

router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'seguimientos';
    const { id } = req.params;
    const tratamientos = await pool.query("SELECT * FROM tratamientos WHERE id = ?", [id]);
    const tratamiento = tratamientos[0];

    console.log(req.body);
    let registro_update = {
        subjetivo: req.body.subjetivo.toUpperCase(),
        objetivo: req.body.objetivo.toUpperCase(),
        diagnostico: req.body.diagnostico.toUpperCase(),
        tratamiento: req.body.tratamiento.toUpperCase(),
        fecha: req.body.fecha,
        hora: req.body.hora,
        edad: req.body.edad,
        peso: req.body.peso,
        imc: req.body.imc,
        pa: req.body.pa,
        fc: req.body.fc,
        fr: req.body.fr,
        temperatura: req.body.temperatura,
    };

    await pool.query("UPDATE tratamientos SET ? WHERE id = ?", [registro_update, tratamiento.id]);
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/tratamientos/'+tratamiento.seguimiento_id);

});

router.post('/destroy/:id', async (req, res, next) => {
    const {id} = req.params;
    const tratamientos = await pool.query("SELECT * FROM tratamientos WHERE id = ?", [id]);
    const tratamiento = tratamientos[0];
    let seguimiento_id = tratamiento.seguimiento_id;
    const result = await pool.query("DELETE FROM tratamientos WHERE id = ?",[id]);
    req.flash('success','Registro eliminado con éxito')
    return res.redirect('/tratamientos/'+seguimiento_id);
});

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

function horaActual()
{
    let date = new Date()
    let hora = date.getHours();
    let minuto = date.getMinutes();
    let segundo = date.getSeconds();

    let hora_actual = `${hora}:${minuto}:${segundo}`;
    return hora_actual;
}

module.exports = router;