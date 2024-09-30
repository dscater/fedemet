const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const historialAccion = require('../lib/historialAccion');
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

    const usuarios = await pool.query("SELECT u.id, u.usuario, u.nombre, u.paterno, u.materno, u.ci, u.ci_exp, u.tipo, u.foto, u.dir, u.fono, u.acceso FROM users u WHERE id != 1 AND estado = 1");
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
    let nom_imagen = 'default.png';
    if (req.file) {
        nom_imagen = req.file.filename;
    } else {
        console.log('SIN ARCHIVOS');
    }
    // VALIDAR EL CI
    let rows = await pool.query("SELECT * FROM users WHERE ci = ?", [req.body.ci]);
    if (rows.length == 0) {
        let name_user = req.body.nombre.trim().charAt(0).toUpperCase()+req.body.paterno.trim().toUpperCase();
        let contrasenia = await helpers.encryptText(req.body.ci);

        let acceso = req.body.acceso && req.body.acceso.trim() !=''?1:0;

        let nuevo_user = {
            usuario: name_user,
            password: contrasenia,
            nombre: req.body.nombre.toUpperCase(),
            paterno: req.body.paterno.toUpperCase(),
            materno: req.body.materno.toUpperCase(),
            ci: req.body.ci,
            ci_exp: req.body.ci_exp,
            dir: req.body.dir.toUpperCase(),
            correo: req.body.correo,
            fono: req.body.fono,
            fecha_registro: fechaActual(),
            tipo: req.body.tipo,
            foto: nom_imagen,
            acceso: acceso
        };

        let nr_user = await pool.query("INSERT INTO users SET ?", [nuevo_user]);
        await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN USUARIO", nuevo_user,null,"USUARIOS")
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
    const usuarios = await pool.query("SELECT u.id, u.usuario, u.tipo,u.ci, u.ci_exp,u.correo, u.foto, u.nombre, u.paterno, u.materno, u.dir, u.fono, u.acceso FROM users u WHERE u.id = ?", [id]);
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
    var nom_imagen = usuario.foto;
    if (req.file) {
        nom_imagen = req.file.filename;
        img_antiguo = usuario.foto;
        if(img_antiguo &&  img_antiguo != 'default.png'){
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
        let acceso = req.body.acceso && req.body.acceso.trim() !=''?1:0;
        let user_update = {
            nombre: req.body.nombre.toUpperCase(),
            paterno: req.body.paterno.toUpperCase(),
            materno: req.body.materno.toUpperCase(),
            ci: req.body.ci,
            ci_exp: req.body.ci_exp,
            dir: req.body.dir.toUpperCase(),
            correo: req.body.correo,
            fono: req.body.fono,
            fecha_registro: fechaActual(),
            tipo: req.body.tipo,
            foto: nom_imagen,
            acceso: acceso
        };
        console.log(user_update)

        let nr_user = await pool.query("UPDATE users SET ? WHERE id = ?", [user_update, usuario.id]);
        
    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UN USAURIO", usuario,user_update,"USAURIOS")
        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/users');
    } else {
        req.flash('error_ci', 'Ya existe alguien registrado con ese número de C.I.')
        res.redirect('/users/edit/' + usuario.id);
    }
});

router.post('/update_password/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'users';

    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const usuario = usuarios[0];
    if(usuario){
        let contrasenia = await helpers.encryptText(req.body.password);
        let user_update = {
            password: contrasenia
        };
        await pool.query("UPDATE users SET ? WHERE id = ?", [user_update, usuario.id]);
    }

    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/users');
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const usuarios = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const usuario = usuarios[0];

    const result = await pool.query("UPDATE users SET estado = 0 WHERE id = ?", [id]);

    await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UN USUARIO", usuario,null,"USUARIOS")
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

router.post('/update_foto/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'users';

    const {
        id
    } = req.params;
    const usuarios = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const usuario = usuarios[0];
    console.log(usuario)
    var nom_imagen = usuario.foto;
    if (req.file && usuario) {
    nom_imagen = req.file.filename;
        img_antiguo = usuario.foto;
            try {
                if(img_antiguo &&  img_antiguo != 'default.png'){
                    fs.unlinkSync('src/public/imgs/users/' + img_antiguo);
                }
                // Verificar si es una petición AJAX
                if (req.xhr) {
                    // Responder con JSON
                    let user_update = {
                        foto: nom_imagen,
                    };
                    console.log(user_update)
            
                    let nr_user = await pool.query("UPDATE users SET ? WHERE id = ?", [user_update, usuario.id]);

                    return res.json({ sw:true });
                } else{
                    return res.redirect('/');
                }

            } catch (err) {
                console.error('Algo salio mal', err);
                return res.json({ sw:false });
            }
    }
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