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
    pagina.actual = 'users'

    const usuarios = await pool.query("SELECT u.id, u.usuario, u.nombre, u.paterno, u.materno, u.ci, u.ci_exp, u.tipo, u.foto, u.dir, u.fono, u.acceso FROM users u WHERE id != 1");
    res.render('users/index', {
        usuarios: usuarios,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'users';

    res.render('users/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'users';
    let nom_imagen = 'user_default.png';
    if (req.file) {
        nom_imagen = req.file.filename;
    } else {
        console.log('SIN ARCHIVOS');
    }
    // VALIDAR EL CI
    let rows = await pool.query("SELECT * FROM users WHERE ci = ?", [req.body.ci]);
    if (rows.length == 0) {
        let name_user = '';
        // OBTENER EL ULTIMO NRO. NOMBRE USUARIO
        let rows_users = [];
        let nro_user = 10001;
        rows_users = await pool.query("SELECT * FROM users WHERE tipo IN('ADMINISTRADOR') ORDER BY id DESC");
        if (req.body.tipo == 'AUXILIAR') {
            nro_user = 20001;
            rows_users = await pool.query("SELECT * FROM users WHERE tipo IN('AUXILIAR','DOCTOR') ORDER BY id DESC");
        }

        if (rows_users.length > 0) {
            let row_user = rows_users[0];
            if (row_user.name != 'admin') {
                nro_user = parseInt(row_user.name) + 1;
            }
        }
        name_user = nro_user;

        let contrasenia = await helpers.encryptText(req.body.ci);

        let nuevo_user = {
            name: name_user,
            password: contrasenia,
            tipo: req.body.tipo,
            foto: nom_imagen,
            estado: 1
        };

        let nr_user = await pool.query("INSERT INTO users SET ?", [nuevo_user]);
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
        datosUsuario.user_id = nr_user_id;
        datosUsuario.fecha_registro = fechaActual();

        let nr_datos_usuario = await pool.query("INSERT INTO users SET ?", [datosUsuario]);
        req.flash('success', 'Registro éxitoso')
        return res.redirect('/users');
    } else {
        error_ci = 'Ya existe alguien registrado con ese número de C.I.';
        res.render('users/create', {
            pagina: pagina,
            data: req.body,
            error_ci: error_ci
        });
    }
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'users';
    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT du.*, u.usuario, u.tipo, u.foto, u.id as user_id FROM users du JOIN users u ON u.id = du.user_id WHERE du.id = ?", [id]);
    const usuario = usuarios[0];
    res.render('users/edit', {
        pagina: pagina,
        usuario: usuario
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'users';

    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const usuario = usuarios[0];
    const users = await pool.query("SELECT * FROM users WHERE id = ?", [usuario.user_id]);
    const user = users[0];
    var nom_imagen = user.foto;
    if (req.file) {
        nom_imagen = req.file.filename;
        img_antiguo = user.foto;
        if(img_antiguo != 'user_default.png'){
            try {
                fs.unlinkSync('src/public/imgs/users/' + img_antiguo);
            } catch (err) {
                console.error('Algo salio mal', err);
            }
        }
    }

    // VALIDAR EL CI
    let rows = await pool.query("SELECT * FROM users WHERE ci = ? AND id != ?", [req.body.ci, id]);
    if (rows.length == 0) {

        let name_user = user.name;
        if (user.tipo != req.body.tipo) {
            // OBTENER EL ULTIMO NRO. NOMBRE USUARIO
            let rows_users = [];
            let nro_user = 10001;
            rows_users = await pool.query("SELECT * FROM users WHERE tipo IN('ADMINISTRADOR') ORDER BY id DESC");
            if (req.body.tipo == 'AUXILIAR') {
                nro_user = 20001;
                rows_users = await pool.query("SELECT * FROM users WHERE tipo IN('AUXILIAR','DOCTOR') ORDER BY id DESC");
            }

            if (rows_users.length > 0) {
                let row_user = rows_users[0];
                if (row_user.name != 'admin') {
                    nro_user = parseInt(row_user.name) + 1;
                }
            }
            name_user = nro_user;
        }

        let user_update = {};
        user_update.name = name_user;
        user_update.tipo = req.body.tipo;
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

        let nr_datos_usuario = await pool.query("UPDATE users SET ? WHERE id = ?", [datosUsuario, usuario.id]);

        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/users');
    } else {
        req.flash('error_ci', 'Ya existe alguien registrado con ese número de C.I.')
        res.redirect('/users/edit/' + usuario.id);
    }
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    const result = await pool.query("UPDATE users SET estado = 0 WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/users');
});

router.get('/config/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'users';
    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const usuario = usuarios[0];
    res.render('users/config', {
        pagina: pagina,
        usuario: usuario
    });
});

router.post('/cuenta_update/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'users';
    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const usuario = usuarios[0];

    let oldPassword = req.body.oldPassword;
    let newPassword = req.body.newPassword;
    let password_confirm = req.body.password_confirm;

    if (await helpers.compareHash(oldPassword, usuario.password)) {
        if (newPassword == password_confirm) {
            let user_update = {
                password: await helpers.encryptText(newPassword)
            }
            let respuesta = await pool.query("UPDATE users SET ? WHERE id = ?", [user_update, usuario.id]);
            req.flash('success', 'Contraseña actualizada con éxito')
        } else {
            req.flash('error', 'Error al confirmar la nueva contraseña')
        }
    } else {
        req.flash('error', 'La contraseña (Antigua contraseña) no coincide con nuestros registros')
    }
    return res.redirect('/users/config/' + usuario.id);
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