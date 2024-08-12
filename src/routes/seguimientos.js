const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    var especialidad = null;
    if (req.user.tipo == 'DOCTOR') {
        var datosUsuario = null;
        var doctor = null;
        var datos_usuarios = [];
        var _doctors = null;
        var _especialidads = null;
        datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?", [req.user.id]);
        if (datos_usuarios.length > 0) {
            datosUsuario = datos_usuarios[0];
        }
        if (datosUsuario) {
            _doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?", [datosUsuario.id]);
            if (_doctors.length > 0) {
                doctor = _doctors[0];
                if (doctor) {
                    _especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctor.especialidad_id]);
                    especialidad = _especialidads[0];
                }
            }
        }
    }

    const seguimientos = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM seguimientos WHERE estado = 1 AND especialidad_id = ?", [especialidad.id]);

    for (let i = 0; i < seguimientos.length; i++) {
        let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [seguimientos[i].paciente_id]);
        let paciente = pacientes[0];
        seguimientos[i].paciente = paciente;
        let tratamientos = await pool.query("SELECT * FROM tratamientos WHERE seguimiento_id = ?", [seguimientos[i].id]);
        let receta_seguimientos = await pool.query("SELECT * FROM receta_seguimientos WHERE seguimiento_id = ?", [seguimientos[i].id]);
        seguimientos[i].tratamientos = tratamientos.length;
        seguimientos[i].receta_seguimientos = receta_seguimientos.length;
    }

    res.render('seguimientos/index', {
        seguimientos: seguimientos,
        pagina
    });
});

router.get('/seguimiento_paciente/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimiento_paciente';
    const {
        id
    } = req.params;

    const seguimientos = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM seguimientos WHERE estado = 1 AND paciente_id = ?", [id]);

    for (let i = 0; i < seguimientos.length; i++) {
        let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [seguimientos[i].paciente_id]);
        let paciente = pacientes[0];
        seguimientos[i].paciente = paciente;
        let tratamientos = await pool.query("SELECT * FROM tratamientos WHERE seguimiento_id = ?", [seguimientos[i].id]);
        seguimientos[i].tratamientos = tratamientos.length;
    }

    res.render('seguimientos/seguimiento_paciente', {
        seguimientos: seguimientos,
        pagina
    });
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    var pacientes = [];
    if (req.user.tipo == 'DOCTOR') {
        var especialidad = null;
        var datosUsuario = null;
        var doctor = null;
        var datos_usuarios = [];
        var _doctors = null;
        var _especialidads = null;
        datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?", [req.user.id]);
        if (datos_usuarios.length > 0) {
            datosUsuario = datos_usuarios[0];
        }
        if (datosUsuario) {
            _doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?", [datosUsuario.id]);
            if (_doctors.length > 0) {
                doctor = _doctors[0];
                if (doctor) {
                    _especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctor.especialidad_id]);
                    especialidad = _especialidads[0];
                }
            }
        }
        pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    res.render('seguimientos/create', {
        pagina: pagina,
        pacientes
    });
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    var especialidad = null;
    if (req.user.tipo == 'DOCTOR') {
        var datosUsuario = null;
        var doctor = null;
        var datos_usuarios = [];
        var _doctors = null;
        var _especialidads = null;
        datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?", [req.user.id]);
        if (datos_usuarios.length > 0) {
            datosUsuario = datos_usuarios[0];
        }
        if (datosUsuario) {
            _doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?", [datosUsuario.id]);
            if (_doctors.length > 0) {
                doctor = _doctors[0];
                if (doctor) {
                    _especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctor.especialidad_id]);
                    especialidad = _especialidads[0];
                }
            }
        }
    }

    let nuevo = {
        especialidad_id: especialidad.id,
        paciente_id: req.body.paciente_id,
        diagnostico: req.body.diagnostico.toUpperCase(),
        detalle: req.body.detalle.toUpperCase(),
        fecha_registro: fechaActual(),
        estado: 1
    };

    let result = await pool.query("INSERT INTO seguimientos SET ?", [nuevo]);
    let nuevo_registro = result.insertId;
    req.flash('success', 'Registro éxitoso')
    return res.redirect('/seguimientos');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';
    const {
        id
    } = req.params;
    const seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [id]);
    const seguimiento = seguimientos[0];

    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [seguimiento.paciente_id]);
    let paciente = pacientes[0];
    seguimiento.paciente = paciente;

    res.render('seguimientos/edit', {
        pagina: pagina,
        seguimiento: seguimiento
    });
});

router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'seguimientos';
    const {
        id
    } = req.params;
    const seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [id]);
    const seguimiento = seguimientos[0];

    console.log(req.body);
    let registro_update = {
        diagnostico: req.body.diagnostico.toUpperCase(),
        detalle: req.body.detalle.toUpperCase(),
    };

    await pool.query("UPDATE seguimientos SET ? WHERE id = ?", [registro_update, seguimiento.id]);
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/seguimientos');

});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    const result = await pool.query("UPDATE seguimientos SET estado = 0 WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/seguimientos');
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

module.exports = router;