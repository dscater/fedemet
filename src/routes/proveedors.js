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
        cb(null, 'src/public/imgs/proveedors/');
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
    pagina.actual = 'proveedors'

    const proveedors = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM proveedors WHERE estado = 1");
    res.render('proveedors/index', {
        proveedors: proveedors,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'proveedors';

    res.render('proveedors/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'proveedors';

    let nuevo_proveedor = {
        razon_social: req.body.razon_social.toUpperCase(),
        nit: req.body.nit.toUpperCase(),
        dir: req.body.dir.toUpperCase(),
        fono: req.body.fono,
        nombre_contacto: req.body.nombre_contacto.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        fecha_registro: fechaActual(),
    };

    let nr_proveedor = await pool.query("INSERT INTO proveedors SET ?", [nuevo_proveedor]);

    await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN NUEVO PROVEEDOR", nuevo_proveedor,null,"PROVEEDORES")

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/proveedors');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'proveedors';
    const {
        id
    } = req.params;
    const proveedors = await pool.query("SELECT * FROM proveedors WHERE id = ?", [id]);
    const proveedor = proveedors[0];
    res.render('proveedors/edit', {
        pagina: pagina,
        proveedor: proveedor
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'proveedors';

    const {
        id
    } = req.params;
    const proveedors = await pool.query("SELECT * FROM proveedors WHERE id = ?", [id]);
    const proveedor = proveedors[0];

    let acceso = req.body.acceso && req.body.acceso.trim() !=''?1:0;
    let proveedor_update = {
        razon_social: req.body.razon_social.toUpperCase(),
        nit: req.body.nit.toUpperCase(),
        dir: req.body.dir.toUpperCase(),
        fono: req.body.fono,
        nombre_contacto: req.body.nombre_contacto.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_proveedor = await pool.query("UPDATE proveedors SET ? WHERE id = ?", [proveedor_update, proveedor.id]);

    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UN PROVEEDOR", proveedor,proveedor_update,"PROVEEDORES")
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/proveedors');
   
});


router.post('/update_password/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'proveedors';

    const {
        id
    } = req.params;
    const proveedors = await pool.query("SELECT * FROM proveedors WHERE id = ?", [id]);
    const proveedor = proveedors[0];
    if(proveedor){
        let contrasenia = await helpers.encryptText(req.body.password);
        let proveedor_update = {
            password: contrasenia
        };
        await pool.query("UPDATE proveedors SET ? WHERE id = ?", [proveedor_update, proveedor.id]);
    }

    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/proveedors');
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const proveedors = await pool.query("SELECT * FROM proveedors WHERE id = ?", [id]);
    const proveedor = proveedors[0];

    const result = await pool.query("UPDATE proveedors SET estado = 0 WHERE id = ?", [id]);

    await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UN PROVEEDOR", proveedor,null,"PROVEEDORES")
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/proveedors');
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