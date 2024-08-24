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
        cb(null, 'src/public/imgs/tipo_salidas/');
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
    pagina.actual = 'tipo_salidas'

    const tipo_salidas = await pool.query("SELECT * FROM tipo_salidas");
    res.render('tipo_salidas/index', {
        tipo_salidas: tipo_salidas,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'tipo_salidas';

    res.render('tipo_salidas/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'tipo_salidas';

    let nuevo_tipo_salida = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_tipo_salida = await pool.query("INSERT INTO tipo_salidas SET ?", [nuevo_tipo_salida]);

    await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN NUEVO TIPO DE SALIDA", nuevo_tipo_salida,null,"TIPO DE SALIDAES")

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/tipo_salidas');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'tipo_salidas';
    const {
        id
    } = req.params;
    const tipo_salidas = await pool.query("SELECT * FROM tipo_salidas WHERE id = ?", [id]);
    const tipo_salida = tipo_salidas[0];
    res.render('tipo_salidas/edit', {
        pagina: pagina,
        tipo_salida: tipo_salida
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'tipo_salidas';

    const {
        id
    } = req.params;
    const tipo_salidas = await pool.query("SELECT * FROM tipo_salidas WHERE id = ?", [id]);
    const tipo_salida = tipo_salidas[0];

    let tipo_salida_update = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
    };

    let nr_tipo_salida = await pool.query("UPDATE tipo_salidas SET ? WHERE id = ?", [tipo_salida_update, tipo_salida.id]);

    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UN TIPO DE SALIDA", tipo_salida,tipo_salida_update,"TIPO DE SALIDAES")
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/tipo_salidas');
   
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const tipo_salidas = await pool.query("SELECT * FROM tipo_salidas WHERE id = ?", [id]);
    const tipo_salida = tipo_salidas[0];

    const salidas = await pool.query("SELECT * FROM salida_productos WHERE tipo_salida_id = ?",[tipo_salida.id]);
    if(salidas.length > 0){
        req.flash('error', 'No es posible eliminar el registro porque esta siendo utilizado')
    }else{
        const result = await pool.query("DELETE FROM tipo_salidas WHERE id = ?", [id]);
        await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UN TIPO DE SALIDA", tipo_salida,null,"TIPO DE SALIDAES")
        req.flash('success', 'Registro eliminado con éxito')
    }
    return res.redirect('/tipo_salidas');
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