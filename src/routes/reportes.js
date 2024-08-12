const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const puppeteer = require('puppeteer');
const hbs = require('handlebars');
const fs = require('fs-extra');

const compile = async function (templateName, data) {
    var templateHtml = await fs.readFile(path.join(process.cwd(), `src/views/reportes/${templateName}.hbs`), 'utf8');
    var html = hbs.compile(templateHtml)({
        datos: data
    });
    return html
};

const generaPDF = async function (archivo, datos, nomFile, tamanio, orientacion,titulo = 'Reporte') {
    let filename = '';
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const content = await compile(archivo, datos);
        await page.setContent(content);
        await page.emulateMediaType('screen');
        filename = `src/public/files/${nomFile}`;

        txt_html = `<div style="font-size: 8px; padding-top: 8px; padding-right:13px; text-align:right; width: 100%;">
        <span>pág.</span> <span class="pageNumber"></span>
      </div>
    `;

        await page.pdf({
            title: titulo,
            landscape: orientacion,
            path: filename,
            format: tamanio,
            displayHeaderFooter: true,
            headerTemplate: txt_html,
            printBackground: true
        });

        console.log('PDF CORRETO');
        await browser.close();
    } catch (e) {
        console.log('ERRROR PDF', e);
    }
    return filename;
}

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    let fecha = fechaActual();

    const especialidads = await pool.query("SELECT e.* FROM especialidads e WHERE e.estado = 1");

    let pacientes = await pool.query("SELECT p.* FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1");

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

    res.render('reportes/index', {
        pagina,
        fecha: fecha,
        especialidads,
        pacientes
    });
});

router.get('/usuarios', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    let filtro = req.query.filtro;
    let tipo = req.query.tipo;

    var usuarios = await pool.query("SELECT * FROM users WHERE estado = 1 AND name != 'admin' AND tipo IN ('ADMINISTRADOR','AUXILIAR')");
    if (filtro != 'todos') {
        if (tipo != 'todos') {
            usuarios = await pool.query("SELECT * FROM users WHERE estado = 1 AND name != 'admin' AND tipo IN ('?')", [tipo]);
        }
    }

    for (let i = 0; i < usuarios.length; i++) {
        let datos_usuarios = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM datos_usuarios WHERE user_id = ?", [usuarios[i].id]);
        let datoUsuario = datos_usuarios[0];
        usuarios[i].datoUsuario = datoUsuario;
    }

    let datos = {};
    datos.usuarios = usuarios;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();

    let url_file = await generaPDF('usuarios', datos, 'Usuarios.pdf', 'A4', true);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/recetas/:id', async (req, res) => {
    pagina = {};
    const {
        id
    } = req.params;
    pagina.actual = 'reportes';

    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    const receta_seguimientos = await pool.query('SELECT *, date_format(fecha,"%d/%m/%Y") as fecha FROM receta_seguimientos WHERE id = ?', [id]);
    const receta_seguimiento = receta_seguimientos[0];

    // OBTENER LAS RECETAS DEL SEGUIMIENTO-RECETAS
    let recetas = await pool.query("SELECT r.*,p.id as producto_id, p.nombre as producto FROM recetas r JOIN productos p ON r.producto_id = p.id WHERE rs_id = ?", [receta_seguimiento.id]);

    let datos = {};
    datos.receta_seguimiento = receta_seguimiento;
    datos.recetas = recetas;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();

    let url_file = await generaPDF('receta', datos, 'Receta.pdf', 'A4', true,'Receta Médica');

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/doctores', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    let filtro = req.query.filtro;
    let especialidad_id = req.query.especialidad_id;
    let fecha_ini = req.query.fecha_ini;
    let fecha_fin = req.query.fecha_fin;

    let doctores = await pool.query("SELECT @i := @i + 1 as contador, d.*, g.nombre as genero, DATE_FORMAT(d.fecha_registro, '%Y-%m-%d') as fecha_registro FROM doctors d JOIN datos_usuarios du ON du.id = d.datos_usuario_id JOIN users u ON u.id = du.user_id cross JOIN generos g ON g.id = d.genero_id join (select @i := 0) d WHERE u.estado = 1;");

    switch (filtro) {
        case 'especialidad':
            if (especialidad_id != 'todos') {
                doctores = await pool.query("SELECT @i := @i + 1 as contador, d.*, g.nombre as genero, DATE_FORMAT(d.fecha_registro, '%Y-%m-%d') as fecha_registro FROM doctors d JOIN datos_usuarios du ON du.id = d.datos_usuario_id JOIN users u ON u.id = du.user_id JOIN generos g ON g.id = d.genero_id join (select @i := 0) d WHERE u.estado = 1 AND d.especialidad_id = ?", [especialidad_id]);
            }
            break;
        case 'fecha':
            if (fecha_ini != '' && fecha_fin != '') {
                doctores = await pool.query("SELECT @i := @i + 1 as contador, d.*, g.nombre as genero, DATE_FORMAT(d.fecha_registro, '%Y-%m-%d') as fecha_registro FROM doctors d JOIN datos_usuarios du ON du.id = d.datos_usuario_id JOIN users u ON u.id = du.user_id JOIN generos g ON g.id = d.genero_id join (select @i := 0) d WHERE u.estado = 1 AND d.fecha_registro BETWEEN ? AND ?", [fecha_ini, fecha_fin]);
            }
            break;
    }

    for (let i = 0; i < doctores.length; i++) {
        let datos_usuarios = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM datos_usuarios WHERE id = ?", [doctores[i].datos_usuario_id]);
        let datosUsuario = datos_usuarios[0];
        doctores[i].datosUsuario = datosUsuario;

        let users = await pool.query("SELECT * FROM users WHERE id = ?", [doctores[i].datosUsuario.user_id]);
        let user = users[0];
        doctores[i].user = user;

        let especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctores[i].especialidad_id]);
        let especialidad = especialidads[0];
        doctores[i].especialidad = especialidad;
    }

    let datos = {};
    datos.doctores = doctores;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();
    let url_file = await generaPDF('doctores', datos, 'Doctores.pdf', 'legal', true);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/pacientes', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    let filtro = req.query.filtro;
    let especialidad_id = req.query.especialidad_id;
    let fecha_ini = req.query.fecha_ini;
    let fecha_fin = req.query.fecha_fin;

    let pacientes = await pool.query("SELECT @i := @i + 1 as contador, p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro,DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') as fecha_nac FROM pacientes p JOIN users u ON u.id = p.user_id cross join (select @i := 0) p WHERE u.estado = 1;");

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
        pacientes = await pool.query("SELECT @i := @i + 1 as contador,p.*, u.foto, u.id as user_id, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads cross join (select @i := 0) p WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    switch (filtro) {
        case 'especialidad':
            if (especialidad_id != 'todos') {
                pacientes = await pool.query("SELECT @i := @i + 1 as contador, p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro,DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') as fecha_nac FROM pacientes p JOIN users u ON u.id = p.user_id JOIN paciente_especialidads pe ON pe.paciente_id = p.id cross join (select @i := 0) p WHERE u.estado = 1 AND pe.especialidad_id = ?", [especialidad_id]);
            }
            break;
        case 'fecha':
            if (fecha_ini != '' && fecha_fin != '') {
                pacientes = await pool.query("SELECT @i := @i + 1 as contador, p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro,DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') as fecha_nac FROM pacientes p JOIN users u ON u.id = p.user_id cross join (select @i := 0) p WHERE u.estado = 1 AND p.fecha_registro BETWEEN ? AND ?", [fecha_ini, fecha_fin]);
            }
            break;
    }

    for (let i = 0; i < pacientes.length; i++) {
        let users = await pool.query("SELECT * FROM users WHERE id = ?", [pacientes[i].user_id]);
        let user = users[0];
        pacientes[i].user = user;
    }

    let datos = {};
    datos.pacientes = pacientes;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();
    let url_file = await generaPDF('pacientes', datos, 'pacientes.pdf', 'legal', true);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/kardex', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    let especialidad_id = req.query.especialidad_id;
    let paciente_id = req.query.paciente_id;

    let pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1");

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
        pacientes = await pool.query("SELECT @i := @i + 1 as contador,p.*, u.foto, u.id as user_id, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads cross join (select @i := 0) p WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    if (paciente_id != 'todos') {
        pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '&Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND p.id = ?", [paciente_id]);
    }

    // RELLENAR SUS ESPECIALIDADES
    for (let i = 0; i < pacientes.length; i++) {
        let consultas = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM consultas WHERE paciente_id = ?", [pacientes[i].id]);
        pacientes[i].consultas = consultas;

        if (especialidad_id != 'todos') {
            consultas = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM consultas WHERE paciente_id = ? AND especialidad_id = ?", [pacientes[i].id, especialidad_id]);
        }
        console.log(pacientes[i].consultas.length + "EEEEEEEEEE");

        for (let j = 0; j < pacientes[i].consultas.length; j++) {

            let especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [pacientes[i].consultas[j].especialidad_id]);
            let especialidad = especialidads[0];
            pacientes[i].consultas[j].especialidad = especialidad;

            let hpPersonals = await pool.query("SELECT * FROM historia_patologica_personals WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let hpPersonal = hpPersonals[0];
            pacientes[i].consultas[j].hpPersonal = hpPersonal;

            let hnpPersonals = await pool.query("SELECT * FROM historia_no_patologica_personals WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let hnpPersonal = hnpPersonals[0];
            pacientes[i].consultas[j].hnpPersonal = hnpPersonal;

            let hpfPersonals = await pool.query("SELECT * FROM historia_patologica_familiars WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let hpfPersonal = hpfPersonals[0];
            pacientes[i].consultas[j].hpfPersonal = hpfPersonal;

            let examen_fisicos = await pool.query("SELECT * FROM examen_fisico WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let examen_fisico = examen_fisicos[0];
            pacientes[i].consultas[j].examen_fisico = examen_fisico;

            let obstreticos = await pool.query("SELECT *, DATE_FORMAT(fin_eAnterior, '%Y-%m-%d') as fin_eAnterior FROM obstreticos WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let obstretico = obstreticos[0];
            pacientes[i].consultas[j].obstretico = obstretico;

            let gestacion_actuals = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM gestacion_actual WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let gestacion_actual = gestacion_actuals[0];
            pacientes[i].consultas[j].gestacion_actual = gestacion_actual;

            let morbilidads = await pool.query("SELECT * FROM morbilidad WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let morbilidad = morbilidads[0];
            pacientes[i].consultas[j].morbilidad = morbilidad;

            let odontologicos = await pool.query("SELECT * FROM odontologico WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let odontologico = odontologicos[0];
            pacientes[i].consultas[j].odontologico = odontologico;

            let laboratorios = await pool.query("SELECT * FROM laboratorios WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let laboratorio = laboratorios[0];
            pacientes[i].consultas[j].laboratorio = laboratorio;
        }
    }

    let datos = {};
    datos.pacientes = pacientes;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();
    let url_file = await generaPDF('kardex', datos, 'kardex.pdf', 'legal', false);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });

});

router.get('/seguimientos', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    let paciente_id = req.query.paciente_id;
    let especialidad_id = req.query.especialidad_id;

    let pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1");

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
        pacientes = await pool.query("SELECT @i := @i + 1 as contador,p.*, u.foto, u.id as user_id, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads cross join (select @i := 0) p WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    if (paciente_id != 'todos') {
        pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '&Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND p.id = ?", [paciente_id]);
    }

    // RELLENAR SUS ESPECIALIDADES
    for (let i = 0; i < pacientes.length; i++) {
        let seguimientos = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM seguimientos WHERE paciente_id = ?", [pacientes[i].id]);
        pacientes[i].seguimientos = seguimientos;

        if (especialidad_id != 'todos') {
            seguimientos = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM seguimientos WHERE paciente_id = ? AND especialidad_id = ?", [pacientes[i].id, especialidad_id]);
        }

        for (let j = 0; j < pacientes[i].seguimientos.length; j++) {

            let especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [pacientes[i].seguimientos[j].especialidad_id]);
            let especialidad = especialidads[0];
            pacientes[i].seguimientos[j].especialidad = especialidad;

            let tratamientos = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM tratamientos WHERE seguimiento_id = ?", [pacientes[i].seguimientos[j].id]);
            pacientes[i].seguimientos[j].tratamientos = tratamientos;
        }
    }

    let datos = {};
    datos.pacientes = pacientes;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();
    let url_file = await generaPDF('seguimiento', datos, 'Seguimientos.pdf', 'A4', true);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/citas', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];

    let paciente_id = req.query.paciente_id;
    let fecha_ini = req.query.fecha_ini;
    let fecha_fin = req.query.fecha_fin;
    let especialidad_id = req.query.especialidad_id;

    let pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1");
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
        pacientes = await pool.query("SELECT @i := @i + 1 as contador,p.*, u.foto, u.id as user_id, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads cross join (select @i := 0) p WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    if (paciente_id != 'todos') {
        pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '&Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND p.id = ?", [paciente_id]);
    }

    // RELLENAR CITAS
    for (let i = 0; i < pacientes.length; i++) {
        let citas = await pool.query("SELECT *,DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM cita_medicas WHERE paciente_id = ? AND fecha BETWEEN ? AND ?", [pacientes[i].id, fecha_ini, fecha_fin]);

        pacientes[i].citas = citas;

        if (especialidad_id != 'todos') {
            citas = await pool.query("SELECT *,DATE_FORMAT(fecha, '%Y-%m-%d') as fecha, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM cita_medicas WHERE paciente_id = ? AND especialidad_id = ? AND fecha BETWEEN ? AND ?", [pacientes[i].id, especialidad_id, fecha_ini, fecha_fin]);
        }

        for (let j = 0; j < pacientes[i].citas.length; j++) {

            let especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [pacientes[i].citas[j].especialidad_id]);
            let especialidad = especialidads[0];
            pacientes[i].citas[j].especialidad = especialidad;
        }
    }

    let datos = {};
    datos.pacientes = pacientes;
    datos.razon_social = razon_social;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();
    let url_file = await generaPDF('citas', datos, 'CitasMedicas.pdf', 'A4', true);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
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