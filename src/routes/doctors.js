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
    pagina.actual = 'doctors';

    const usuarios = await pool.query("SELECT du.*, u.name as usuario, u.tipo, u.foto, u.id as user_id, e.nombre especialidad FROM datos_usuarios du JOIN users u ON u.id = du.user_id JOIN doctors d ON d.datos_usuario_id = du.id JOIN especialidads e ON e.id = d.especialidad_id WHERE u.estado = 1 AND u.tipo IN('DOCTOR')");
    res.render('doctors/index', {
        usuarios: usuarios,
        pagina: pagina
    });
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'doctors';
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE estado = 1");
    const generos = await pool.query("SELECT * FROM generos");
    res.render('doctors/create', {
        pagina,
        especialidads,
        generos
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'doctors';
    let nom_imagen = 'user_default.png';
    if (req.file) {
        nom_imagen = req.file.filename;
    } else {
        console.log('SIN ARCHIVOS');
    }
    // VALIDAR EL CI
    let rows = await pool.query("SELECT * FROM datos_usuarios WHERE ci = ?", [req.body.ci]);
    if (rows.length == 0) {
        let name_user = '';
        // OBTENER EL ULTIMO NRO. NOMBRE USUARIO
        let rows_users = await pool.query("SELECT * FROM users WHERE tipo IN('AUXILIAR','DOCTOR') ORDER BY id DESC");
        let nro_user = 20001;
        if (rows_users.length > 0) {
            let row_user = rows_users[0];
            nro_user = parseInt(row_user.name) + 1;
        }
        name_user = nro_user;

        let contrasenia = await helpers.encryptText(req.body.ci);

        let nuevo_user = {
            name: name_user,
            password: contrasenia,
            tipo: 'DOCTOR',
            foto: nom_imagen,
            estado: 1
        };

        let nr_user = await pool.query("INSERT INTO users SET ?", [nuevo_user]);
        let nr_user_id = nr_user.insertId;
        // DATOSUSUARIO
        const datosUsuario = {};
        datosUsuario.nombre = req.body.nombre.toUpperCase();
        datosUsuario.paterno = req.body.paterno.toUpperCase();
        datosUsuario.materno = req.body.materno.toUpperCase();
        datosUsuario.ci = req.body.ci;
        datosUsuario.ci_exp = req.body.ci_exp;
        datosUsuario.dir = req.body.dir.toUpperCase();
        datosUsuario.email = req.body.email;
        datosUsuario.fono = req.body.fono;
        datosUsuario.cel = req.body.cel;
        datosUsuario.user_id = nr_user_id;
        datosUsuario.fecha_registro = fechaActual();

        let nr_datos_usuario = await pool.query("INSERT INTO datos_usuarios SET ?", [datosUsuario]);
        let datos_usuario_id = nr_datos_usuario.insertId;

        // OBTENER EL ULTIMO NRO DE REGISTRO
        let rows_doctors = await pool.query("SELECT * FROM doctors ORDER BY id DESC");
        let nro_reg = 1;
        if (rows_doctors.length > 0) {
            let row_doctor = rows_doctors[0];
            nro_reg = parseInt(row_doctor.nro) + 1;
        }
        // DOCTOR
        const oDoctor = {
            datos_usuario_id: datos_usuario_id,
            nro: nro_reg,
            fecha_nac: req.body.fecha_nac,
            lugar_nac: req.body.lugar_nac.toUpperCase(),
            genero_id: req.body.genero_id,
            estado_civil: req.body.estado_civil,
            nombre_familiar: req.body.nombre_familiar.toUpperCase(),
            fono_familiar: req.body.fono_familiar.toUpperCase(),
            correo_familiar: req.body.correo_familiar,
            especialidad_id: req.body.especialidad_id,
            fecha_registro: fechaActual(),
        }

        let nr_doctor = await pool.query("INSERT INTO doctors SET ?", [oDoctor]);
        let doctor_id = nr_doctor.insertId;

        req.flash('success', 'Registro éxitoso')
        return res.redirect('/doctors');
    } else {
        error_ci = 'Ya existe alguien registrado con ese número de C.I.';
        const especialidads = await pool.query("SELECT * FROM especialidads WHERE estado = 1");
        res.render('doctors/create', {
            pagina: pagina,
            data: req.body,
            error_ci: error_ci,
            especialidads
        });
    }
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'doctors';
    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT du.*, u.name as usuario, u.tipo, u.foto, u.id as user_id, e.nombre especialidad, e.id as especialidad_id, DATE_FORMAT(d.fecha_nac, '%Y-%m-%d') as fecha_nac, d.lugar_nac, g.nombre as genero, g.id as genero_id, d.estado_civil, d.nombre_familiar, d.fono_familiar, d.correo_familiar FROM datos_usuarios du JOIN users u ON u.id = du.user_id JOIN doctors d ON d.datos_usuario_id = du.id JOIN especialidads e ON e.id = d.especialidad_id JOIN generos g ON g.id = d.genero_id WHERE du.id = ?", [id]);
    const usuario = usuarios[0];

    const especialidads = await pool.query("SELECT * FROM especialidads WHERE estado = 1");
    const generos = await pool.query("SELECT * FROM generos");

    res.render('doctors/edit', {
        pagina: pagina,
        usuario: usuario,
        especialidads,
        generos
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'doctors';

    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE id = ?", [id]);
    const usuario = usuarios[0];
    const users = await pool.query("SELECT * FROM users WHERE id = ?", [usuario.user_id]);
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
    let rows = await pool.query("SELECT * FROM datos_usuarios WHERE ci = ? AND id != ?", [req.body.ci, id]);
    console.log(id);
    if (rows.length == 0) {
        let user_update = {};
        user_update.foto = nom_imagen;
        console.log(user_update)

        let nr_user = await pool.query("UPDATE users SET ? WHERE id = ?", [user_update, user.id]);
        let nr_user_id = nr_user.insertId;
        const datosUsuario = {};
        datosUsuario.nombre = req.body.nombre.toUpperCase();
        datosUsuario.paterno = req.body.paterno.toUpperCase();
        datosUsuario.materno = req.body.materno.toUpperCase();
        datosUsuario.ci = req.body.ci;
        datosUsuario.ci_exp = req.body.ci_exp;
        datosUsuario.dir = req.body.dir.toUpperCase();
        datosUsuario.email = req.body.email;
        datosUsuario.fono = req.body.fono;
        datosUsuario.cel = req.body.cel;
        datosUsuario.fecha_registro = fechaActual();

        let nr_datos_usuario = await pool.query("UPDATE datos_usuarios SET ? WHERE id = ?", [datosUsuario, usuario.id]);


        // DOCTOR
        const oDoctor = {
            fecha_nac: req.body.fecha_nac,
            lugar_nac: req.body.lugar_nac.toUpperCase(),
            genero_id: req.body.genero_id,
            estado_civil: req.body.estado_civil,
            nombre_familiar: req.body.nombre_familiar.toUpperCase(),
            fono_familiar: req.body.fono_familiar,
            correo_familiar: req.body.correo_familiar,
            especialidad_id: req.body.especialidad_id,
        }
        let resp_doctor = await pool.query("UPDATE doctors SET ? WHERE datos_usuario_id = ?", [oDoctor, usuario.id]);

        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/doctors');
    } else {
        req.flash('error_ci', 'Ya existe alguien registrado con ese número de C.I.')
        res.redirect('/doctors/edit/' + usuario.id);
    }
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    const result = await pool.query("UPDATE users SET estado = 0 WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/doctors');
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

function nombreUsuario(nombre, paterno) {
    let nombreUser = nombre.substring(0, 1) + paterno;
    nombreUser = nombreUser.toUpperCase();
    return nombreUser;
}

module.exports = router;