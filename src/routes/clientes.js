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
        cb(null, 'src/public/imgs/clientes/');
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
    pagina.actual = 'clientes'

    const clientes = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM clientes WHERE estado = 1");
    res.render('clientes/index', {
        clientes: clientes,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'clientes';

    res.render('clientes/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'clientes';

    if(!req.body.fono || req.body.fono.trim() ==''){
        error_fono = 'Debes ingresar al menos un número de teléfono';
        res.render('clientes/create', {
            pagina: pagina,
            data: req.body,
            error_fono
        });
    }else{
        let nuevo_cliente = {
            nombre: req.body.nombre.toUpperCase(),
            ci: req.body.ci,
            ci_exp: req.body.ci_exp,
            nit: (""+req.body.nit).toUpperCase(),
            fono: req.body.fono.toUpperCase(),
            correo: req.body.correo.toUpperCase(),
            dir: req.body.dir.toUpperCase(),
            fecha_registro: fechaActual(),
        };
    
        let nr_cliente = await pool.query("INSERT INTO clientes SET ?", [nuevo_cliente]);
    
        await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN NUEVO CLIENTE", nuevo_cliente,null,"CLIENTES")
    
        req.flash('success', 'Registro éxitoso')
        return res.redirect('/clientes');
    }
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'clientes';
    const {
        id
    } = req.params;
    const clientes = await pool.query("SELECT * FROM clientes WHERE id = ?", [id]);
    const cliente = clientes[0];
    res.render('clientes/edit', {
        pagina: pagina,
        cliente: cliente
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'clientes';

    const {
        id
    } = req.params;
    const clientes = await pool.query("SELECT * FROM clientes WHERE id = ?", [id]);
    const cliente = clientes[0];

    if(!req.body.fono || req.body.fono.trim() ==''){
        res.render('clientes/edit', {
            pagina: pagina,
            cliente: cliente,
            error_fono:"Debes ingresar al menos un número de teléfono"
        });
    }else{
        let cliente_update = {
            nombre: req.body.nombre.toUpperCase(),
            ci: req.body.ci,
            ci_exp: req.body.ci_exp,
            nit: req.body.nit.toUpperCase(),
            fono: req.body.fono.toUpperCase(),
            correo: req.body.correo.toUpperCase(),
            dir: req.body.dir.toUpperCase(),
        };
    
        let nr_cliente = await pool.query("UPDATE clientes SET ? WHERE id = ?", [cliente_update, cliente.id]);
    
        await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UNA CLIENTE", cliente,cliente_update,"CLIENTES")
        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/clientes');
    }
});


router.post('/update_password/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'clientes';

    const {
        id
    } = req.params;
    const clientes = await pool.query("SELECT * FROM clientes WHERE id = ?", [id]);
    const cliente = clientes[0];
    if(cliente){
        let contrasenia = await helpers.encryptText(req.body.password);
        let cliente_update = {
            password: contrasenia
        };
        await pool.query("UPDATE clientes SET ? WHERE id = ?", [cliente_update, cliente.id]);
    }

    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/clientes');
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const clientes = await pool.query("SELECT * FROM clientes WHERE id = ?", [id]);
    const cliente = clientes[0];

    const result = await pool.query("UPDATE clientes SET estado = 0 WHERE id = ?", [id]);

    await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UNA CLIENTE", cliente,null,"CLIENTES")
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/clientes');
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