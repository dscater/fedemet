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
        cb(null, 'src/public/imgs/tipo_ingresos/');
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
    pagina.actual = 'tipo_ingresos'

    const tipo_ingresos = await pool.query("SELECT * FROM tipo_ingresos");
    res.render('tipo_ingresos/index', {
        tipo_ingresos: tipo_ingresos,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'tipo_ingresos';

    res.render('tipo_ingresos/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'tipo_ingresos';

    let nuevo_tipo_ingreso = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_tipo_ingreso = await pool.query("INSERT INTO tipo_ingresos SET ?", [nuevo_tipo_ingreso]);

    await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN NUEVO TIPO DE INGRESO", nuevo_tipo_ingreso,null,"TIPO DE INGRESOES")

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/tipo_ingresos');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'tipo_ingresos';
    const {
        id
    } = req.params;
    const tipo_ingresos = await pool.query("SELECT * FROM tipo_ingresos WHERE id = ?", [id]);
    const tipo_ingreso = tipo_ingresos[0];
    res.render('tipo_ingresos/edit', {
        pagina: pagina,
        tipo_ingreso: tipo_ingreso
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'tipo_ingresos';

    const {
        id
    } = req.params;
    const tipo_ingresos = await pool.query("SELECT * FROM tipo_ingresos WHERE id = ?", [id]);
    const tipo_ingreso = tipo_ingresos[0];

    let tipo_ingreso_update = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_tipo_ingreso = await pool.query("UPDATE tipo_ingresos SET ? WHERE id = ?", [tipo_ingreso_update, tipo_ingreso.id]);

    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UN TIPO DE INGRESO", tipo_ingreso,tipo_ingreso_update,"TIPO DE INGRESOES")
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/tipo_ingresos');
   
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const tipo_ingresos = await pool.query("SELECT * FROM tipo_ingresos WHERE id = ?", [id]);
    const tipo_ingreso = tipo_ingresos[0];

    const ingresos = await pool.query("SELECT * FROM ingreso_productos WHERE tipo_ingreso_id = ?",[tipo_ingreso.id]);
    if(ingresos.length > 0){
        req.flash('error', 'No es posible eliminar el registro porque esta siendo utilizado')
    }else{
        const result = await pool.query("DELETE FROM tipo_ingresos WHERE id = ?", [id]);
        await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UN TIPO DE INGRESO", tipo_ingreso,null,"TIPO DE INGRESOES")
        req.flash('success', 'Registro eliminado con éxito')
    }
    return res.redirect('/tipo_ingresos');
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