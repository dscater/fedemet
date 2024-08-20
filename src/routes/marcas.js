const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const historialAccion = require('../lib/historialAccion');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/marcas/');
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
    pagina.actual = 'marcas'

    const marcas = await pool.query("SELECT * FROM marcas WHERE estado = 1");
    res.render('marcas/index', {
        marcas: marcas,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'marcas';

    res.render('marcas/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'marcas';

    let nuevo_marca = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_marca = await pool.query("INSERT INTO marcas SET ?", [nuevo_marca]);

    await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN NUEVO MARCA", nuevo_marca,null,"MARCAS")

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/marcas');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'marcas';
    const {
        id
    } = req.params;
    const marcas = await pool.query("SELECT * FROM marcas WHERE id = ?", [id]);
    const marca = marcas[0];
    res.render('marcas/edit', {
        pagina: pagina,
        marca: marca
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'marcas';

    const {
        id
    } = req.params;
    const marcas = await pool.query("SELECT * FROM marcas WHERE id = ?", [id]);
    const marca = marcas[0];

    let acceso = req.body.acceso && req.body.acceso.trim() !=''?1:0;
    let marca_update = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_marca = await pool.query("UPDATE marcas SET ? WHERE id = ?", [marca_update, marca.id]);

    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UNA MARCA", marca,marca_update,"MARCAS")
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/marcas');
   
});


router.post('/update_password/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'marcas';

    const {
        id
    } = req.params;
    const marcas = await pool.query("SELECT * FROM marcas WHERE id = ?", [id]);
    const marca = marcas[0];
    if(marca){
        let contrasenia = await helpers.encryptText(req.body.password);
        let marca_update = {
            password: contrasenia
        };
        await pool.query("UPDATE marcas SET ? WHERE id = ?", [marca_update, marca.id]);
    }

    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/marcas');
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const marcas = await pool.query("SELECT * FROM marcas WHERE id = ?", [id]);
    const marca = marcas[0];

    const result = await pool.query("UPDATE marcas SET estado = 0 WHERE id = ?", [id]);

    await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UNA MARCA", marca,null,"MARCAS")
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/marcas');
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