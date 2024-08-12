const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'citas';

    var especialidad = null;
    let citas = [];
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

    if(especialidad){
        citas = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM cita_medicas WHERE especialidad_id = ?", [especialidad.id]);
    }else{
        citas = await pool.query("SELECT cm.*, DATE_FORMAT(cm.fecha, '%Y-%m-%d') as fecha FROM cita_medicas cm JOIN especialidads e ON cm.especialidad_id = e.id");
    }

    for (let i = 0; i < citas.length; i++) {
        let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [citas[i].paciente_id]);
        let paciente = pacientes[0];
        citas[i].paciente = paciente;
    }

    res.render('citas/index', {
        citas: citas,
        pagina
    });
});

router.get('/citas_paciente/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'citas_paciente';
    const {id} = req.params;
    const citas = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,DATE_FORMAT(hora, '%H:%i') as hora FROM cita_medicas WHERE paciente_id = ?", [id]);

    let horas = array_horas();

    res.render('citas/citas_paciente', {
        pagina: pagina,
        citas: citas,
        horas: horas
    });
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'citas';


    let horas = array_horas();
    let especialidades = [];
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
    }else{
        pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE paciente_id = p.id)");
        especialidades = await pool.query("SELECT * FROM especialidads");
    }

    let fecha = fechaActual();

    res.render('citas/create', {
        pagina: pagina,
        pacientes,
        horas: horas,
        especialidad,
        fecha: fecha,
        especialidades
    });
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'citas';

    let nuevo = {
        especialidad_id: req.body.especialidad_id,
        paciente_id: req.body.paciente_id,
        fecha: req.body.fecha,
        hora: req.body.hora,
        estado: req.body.estado,
        fecha_registro: fechaActual(),
    };

    let result = await pool.query("INSERT INTO cita_medicas SET ?", [nuevo]);
    let nuevo_registro = result.insertId;
    req.flash('success', 'Registro éxitoso')
    return res.redirect('/citas');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'citas';
    const {
        id
    } = req.params;
    const citas = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,DATE_FORMAT(hora, '%H:%i') as hora FROM cita_medicas WHERE id = ?", [id]);
    const cita = citas[0];

    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [cita.paciente_id]);
    let paciente = pacientes[0];
    cita.paciente = paciente;
    let especialidades = [];
    var _pacientes = [];
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
        _pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }
    else{
        _pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE paciente_id = p.id)");
        especialidades = await pool.query("SELECT * FROM especialidads");
    }

    let horas = array_horas();

    res.render('citas/edit', {
        pagina: pagina,
        cita: cita,
        pacientes: _pacientes,
        horas: horas,
        especialidades
    });
});

router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'citas';
    const {
        id
    } = req.params;
    const citas = await pool.query("SELECT * FROM cita_medicas WHERE id = ?", [id]);
    const cita = citas[0];

    let registro_update = {
        paciente_id: req.body.paciente_id,
        fecha: req.body.fecha,
        hora: req.body.hora,
        estado: req.body.estado,
    };

    await pool.query("UPDATE cita_medicas SET ? WHERE id = ?", [registro_update, cita.id]);
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/citas');

});

router.get('/show/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'citas';
    const {
        id
    } = req.params;
    const citas = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,DATE_FORMAT(hora, '%H:%i') as hora FROM cita_medicas WHERE id = ?", [id]);
    const cita = citas[0];

    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [cita.paciente_id]);
    let paciente = pacientes[0];
    cita.paciente = paciente;

    let especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [cita.especialidad_id]);
    let especialidad = especialidads[0];
    cita.especialidad = especialidad;

    res.render('citas/show', {
        pagina: pagina,
        cita: cita
    });
});


router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    const result = await pool.query("DELETE FROM cita_medicas WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/citas');
});

function array_horas() {
    let array_horas = [];
    let horas = 0;
    let minutos = 0;
    let hora_select = '';
    for (let i = 1; i <= 48; i++) {
        hora_select = '';

        if (horas < 10) {
            hora_select += '0' + horas;
        } else {
            hora_select += horas;
        }

        if (minutos == 0) {
            hora_select += ':00';
        } else {
            hora_select += ':30';
        }

        array_horas.push(hora_select);
        if (minutos == 30) {
            minutos = 0;
            horas++;
        } else {
            minutos = 30;
        }
    }
    return array_horas;
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

module.exports = router;