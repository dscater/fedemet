const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const multer = require('multer');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/users/');
    },
    filename: async (req, file, cb) => {
        let nom_img = req.body.nombre + Date.now() + path.extname(file.originalname);
        cb(null, nom_img);
    }
});

const fileFilter = async (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
    cb(null, false);
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'pacientes';

    var pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id, u.name as usuario FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1");

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
        pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id, u.name as usuario FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    res.render('pacientes/index', {
        pacientes: pacientes,
        pagina: pagina
    });
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'pacientes';
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE estado = 1");
    const generos = await pool.query("SELECT * FROM generos");

    res.render('pacientes/create', {
        pagina,
        especialidads,
        generos: generos,
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'pacientes';
    let nom_imagen = 'user_default.png';
    if (req.file) {
        nom_imagen = req.file.filename;
    } else {
        console.log('SIN ARCHIVOS');
    }
    // VALIDAR EL CI
    let rows = await pool.query("SELECT * FROM pacientes WHERE ci = ?", [req.body.ci]);
    if (rows.length == 0) {
        let name_user = nombreUsuario(req.body.nombre, req.body.paterno, req.body.materno, req.body.ci);
        let existeNombre = [];
        existeNombre = await pool.query("SELECT * FROM users WHERE name = ?", [name_user]);
        cont = 1;
        while (existeNombre.length > 0) {
            name_user = name_user + cont;
            existeNombre = await pool.query("SELECT * FROM users WHERE name = ?", [name_user]);
            cont++;
        }

        let contrasenia = await helpers.encryptText(req.body.ci);

        let nuevo_user = {
            name: name_user,
            password: contrasenia,
            tipo: 'PACIENTE',
            foto: nom_imagen,
            estado: 1
        };

        let nr_user = await pool.query("INSERT INTO users SET ?", [nuevo_user]);
        let nr_user_id = nr_user.insertId;
        // DATOSUSUARIO

        // OBTENER EL ULTIMO NRO DE REGISTRO
        let rows_pacientes = await pool.query("SELECT * FROM pacientes ORDER BY id DESC");
        let nro_reg = 1;
        if (rows_pacientes.length > 0) {
            let row_paciente = rows_pacientes[0];
            nro_reg = parseInt(row_paciente.nro) + 1;
        }
        // DOCTOR
        const oPaciente = {
            nro: nro_reg,
            nombre: req.body.nombre.toUpperCase(),
            paterno: req.body.paterno.toUpperCase(),
            materno: req.body.materno.toUpperCase(),
            ci: req.body.ci,
            ci_exp: req.body.ci_exp,
            dir: req.body.dir.toUpperCase(),
            email: req.body.email,
            fono: req.body.fono,
            cel: req.body.cel,
            fecha_nac: req.body.fecha_nac,
            lugar_nac: req.body.lugar_nac.toUpperCase(),
            genero_id: req.body.genero_id.toUpperCase(),
            estado_civil: req.body.estado_civil.toUpperCase(),
            nacionalidad: req.body.nacionalidad.toUpperCase(),
            nombre_familiar: req.body.nombre_familiar.toUpperCase(),
            fono_familiar: req.body.fono_familiar.toUpperCase(),
            ocupacion: req.body.ocupacion.toUpperCase(),
            user_id: nr_user_id,
            fecha_registro: fechaActual(),
        }

        let nuevo_paciente = await pool.query("INSERT INTO pacientes SET ?", [oPaciente]);
        let paciente_id = nuevo_paciente.insertId;

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

        let oPacienteEspecialidad = {
            paciente_id: paciente_id,
            especialidad_id: especialidad.id,
        };
        await pool.query("INSERT INTO paciente_especialidads SET ?", [oPacienteEspecialidad]);
        req.flash('success', 'Registro éxitoso')
        return res.redirect('/pacientes');
    } else {
        error_ci = 'Ya existe alguien registrado con ese número de C.I.';
        res.render('pacientes/create', {
            pagina: pagina,
            data: req.body,
            error_ci: error_ci
        });
    }
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'pacientes';
    const {
        id
    } = req.params;
    const pacientes = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') as fecha_nac FROM pacientes p WHERE p.id = ?", [id]);
    const paciente = pacientes[0];
    const generos = await pool.query("SELECT * FROM generos");

    res.render('pacientes/edit', {
        pagina: pagina,
        paciente: paciente,
        generos: generos,
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'pacientes';

    const {
        id
    } = req.params;
    const pacientes = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_nac, '%Y-%m-%d') as fecha_nac FROM pacientes p WHERE p.id = ?", [id]);
    const paciente = pacientes[0];

    const users = await pool.query("SELECT * FROM users WHERE id = ?", [paciente.user_id]);
    const user = users[0];
    var nom_imagen = user.foto;
    if (req.file) {
        nom_imagen = req.file.filename;
        img_antiguo = user.foto;
        if (img_antiguo != 'user_default.png') {
            try {
                fs.unlinkSync('src/public/imgs/users/' + img_antiguo);
            } catch (err) {
                console.error('Algo salio mal', err);
            }
        }
    }

    // VALIDAR EL CI
    let rows = await pool.query("SELECT * FROM pacientes WHERE ci = ? AND id != ?", [req.body.ci, id]);
    if (rows.length == 0) {
        let user_update = {};
        user_update.foto = nom_imagen;

        let result = await pool.query("UPDATE users SET ? WHERE id = ?", [user_update, user.id]);

        // PACIENTE
        const oPaciente = {
            nombre: req.body.nombre.toUpperCase(),
            paterno: req.body.paterno.toUpperCase(),
            materno: req.body.materno.toUpperCase(),
            ci: req.body.ci,
            ci_exp: req.body.ci_exp,
            dir: req.body.dir.toUpperCase(),
            email: req.body.email,
            fono: req.body.fono,
            cel: req.body.cel,
            fecha_nac: req.body.fecha_nac,
            lugar_nac: req.body.lugar_nac.toUpperCase(),
            genero_id: req.body.genero_id.toUpperCase(),
            estado_civil: req.body.estado_civil.toUpperCase(),
            nacionalidad: req.body.nacionalidad.toUpperCase(),
            nombre_familiar: req.body.nombre_familiar.toUpperCase(),
            fono_familiar: req.body.fono_familiar.toUpperCase(),
            ocupacion: req.body.ocupacion.toUpperCase(),
            fecha_registro: fechaActual(),
        }
        let res_paciente = await pool.query("UPDATE pacientes SET ? WHERE id = ?", [oPaciente, paciente.id]);

        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/pacientes');
    } else {
        req.flash('error_ci', 'Ya existe alguien registrado con ese número de C.I.')
        res.redirect('/pacientes/edit/' + usuario.id);
    }
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    const result = await pool.query("UPDATE users SET estado = 0 WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/pacientes');
});

router.get('/registrarExistente', async (req, res) => {
    pagina = {};
    pagina.actual = 'pacientes';
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
        pacientes = await pool.query("SELECT DISTINCT(p.id) AS id,p.nombre, p.paterno, p.materno FROM pacientes p JOIN paciente_especialidads pe ON pe.paciente_id = p.id WHERE NOT EXISTS (SELECT * FROM paciente_especialidads WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    res.render('pacientes/registraExiste', {
        pacientes: pacientes,
        pagina: pagina
    });
});

router.post('/storeExistente', async (req, res) => {
    let id = req.body.paciente_id;
    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [id]);
    let paciente = pacientes[0];
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
    }

    let oPacienteEspecialidad = {
        paciente_id: paciente.id,
        especialidad_id: especialidad.id,
    };
    await pool.query("INSERT INTO paciente_especialidads SET ?", [oPacienteEspecialidad]);

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/pacientes');
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

function nombreUsuario(nombre, paterno, materno, ci) {
    let nombreUser = nombre.substring(0, 1) + paterno.substring(0, 1) + ci;
    if (materno != '' && materno != null) {
        nombreUser = nombre.substring(0, 1) + paterno.substring(0, 1) + materno.substring(0, 1) + ci;
    }
    nombreUser = nombreUser.toUpperCase();
    return nombreUser;
}

module.exports = router;