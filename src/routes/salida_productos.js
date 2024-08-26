const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const historialAccion = require('../lib/historialAccion');
const kardexStock = require('../lib/kardexStock');
const multer = require('multer');
const fs = require('fs');
const { promisify } = require('util');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/salida_productos/');
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
    pagina.actual = 'salida_productos'

    const salida_productos = await pool.query("SELECT ip.*, p.nombre as p_nombre, ti.nombre as ts_nombre,DATE_FORMAT(ip.fecha_registro, '%Y-%m-%d') as fecha_registro,DATE_FORMAT(ip.fecha_salida, '%Y-%m-%d') as fecha_salida FROM salida_productos ip INNER JOIN productos p ON ip.producto_id = p.id INNER JOIN tipo_salidas ti ON ti.id = ip.tipo_salida_id WHERE p.estado = 1");
    res.render('salida_productos/index', {
        salida_productos: salida_productos,
        pagina
    });
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'salida_productos';

    const productos = await pool.query("SELECT p.* FROM productos p WHERE p.estado = 1");
    const tipo_salidas = await pool.query("SELECT * FROM tipo_salidas");
    res.render('salida_productos/create', {
        pagina: pagina,
        productos,
        tipo_salidas
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'salida_productos';

    let nuevo_salida_producto = {
        producto_id:req.body.producto_id,
        cantidad:req.body.cantidad,
        fecha_salida:req.body.fecha_salida,
        tipo_salida_id:req.body.tipo_salida_id,
        descripcion: req.body.descripcion.toUpperCase(),
        fecha_registro:fechaActual()
    };
   // iniciar transaccion
    const connection = await pool.getConnection();
    try{
        await promisify(connection.beginTransaction).call(connection); // Inicia la transacción

        let nr_salida_producto = await pool.query("INSERT INTO salida_productos SET ?", [nuevo_salida_producto]);
        // kardex
        await kardexStock.registroEgreso("SALIDA",nr_salida_producto.insertId, req.body.producto_id,req.body.cantidad);

        await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UNA NUEVA SALIDA DE PRODUCTO", nuevo_salida_producto,null,"SALIDA DE PRODUCTOS")
        await promisify(connection.commit).call(connection);
        req.flash('success', 'Registro éxitoso')
        return res.redirect('/salida_productos');
    }catch(error){
        await promisify(connection.rollback).call(connection);
        req.flash('error', 'Error interno del sistema, no se pudo guardar el registro')
        return res.redirect('/salida_productos/create');
    }
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'salida_productos';
    const {
        id
    } = req.params;
    const salida_productos = await pool.query("SELECT ip.*,DATE_FORMAT(ip.fecha_salida, '%Y-%m-%d') as fecha_salida, p.nombre as p_nombre FROM salida_productos ip INNER JOIN productos p ON p.id = ip.producto_id WHERE ip.id = ?", [id]);
    const salida_producto = salida_productos[0];
    const tipo_salidas = await pool.query("SELECT * FROM tipo_salidas");

    res.render('salida_productos/edit', {
        pagina: pagina,
        salida_producto: salida_producto,
        tipo_salidas
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'salida_productos';

    const {
        id
    } = req.params;

    // iniciar transaccion
    const connection = await pool.getConnection();
    try{
        await promisify(connection.beginTransaction).call(connection); // Inicia la transacción

        const salida_productos = await pool.query("SELECT * FROM salida_productos WHERE id = ?", [id]);
        const salida_producto = salida_productos[0];
    
        // incrementar stock
        await kardexStock.incrementarStock(salida_producto.producto_id,salida_producto.cantidad)
    
        let salida_producto_update = {
            fecha_salida:req.body.fecha_salida,
            cantidad:req.body.cantidad,
            tipo_salida_id:req.body.tipo_salida_id,
            descripcion: req.body.descripcion.toUpperCase(),
        };
    
        // actualizar salida
        await pool.query("UPDATE salida_productos SET ? WHERE id = ?", [salida_producto_update, salida_producto.id]);
    
        // decrementar stock
        await kardexStock.decrementarStock(salida_producto.producto_id,salida_producto_update.cantidad)

        // actualizar kardex
        let kardexs = await pool.query("SELECT * FROM kardex_productos WHERE tipo_registro='SALIDA' AND registro_id=? AND producto_id=?",[salida_producto.id,salida_producto.producto_id])
        let kardex = kardexs[0]
        let res_actualizacion = await kardexStock.actualizaRegistrosKardex(kardex.id,kardex.producto_id);
        if(!res_actualizacion){
            throw new "Error al actualizar el registro";
        }
    
        await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UNA SALIDA DE PRODUCTO", salida_producto,salida_producto_update,"SALIDA DE PRODUCTOS")
        await promisify(connection.commit).call(connection);
        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/salida_productos');

    }catch(error){
        await promisify(connection.rollback).call(connection);
        req.flash('error', 'Error interno del sistema, no se pudo actualizar el registro')
        return res.redirect('/salida_productos/edit/'+ id);
    }
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;


    // iniciar transaccion
    const connection = await pool.getConnection();

    try{
        await promisify(connection.beginTransaction).call(connection); 
        const salida_productos = await pool.query("SELECT * FROM salida_productos WHERE id = ?", [id]);
        const salida_producto = salida_productos[0];

        const registros_kardex = await pool.query("SELECT * FROM kardex_productos WHERE tipo_registro='SALIDA' AND registro_id=? AND producto_id=?",[salida_producto.id,salida_producto.producto_id])
        const kardex = registros_kardex[0];
        // eliminar kardex
        let id_kardex = kardex.id;
        let id_producto = kardex.producto_id;
        await pool.query("DELETE FROM kardex_productos WHERE id = ?",[id_kardex]);

        const anteriores = await pool.query("SELECT * FROM kardex_productos WHERE id < ? ORDER BY id DESC",[id_kardex])
        const anterior = anteriores[0]
        let actualiza_desde = null;
        let siguientes = [];
        let siguiente=null;
        if(anterior){
            actualiza_desde = anterior;
        }else{
            siguientes = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? AND id > ?",[salida_producto.producto_id,id_kardex])
            siguiente = siguientes[0]
            if(siguiente){
                actualiza_desde = siguiente;
            }
        }

        if(actualiza_desde){
            await kardexStock.actualizaRegistrosKardex(actualiza_desde.id, actualiza_desde.producto_id)
        }
        
        // registrar incremento
        await kardexStock.incrementarStock(salida_producto.producto_id,salida_producto.cantidad);

        const result = await pool.query("DELETE FROM salida_productos WHERE id = ?", [id]);
        await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UNA SALIDA DE PRODUCTO", salida_producto,null,"SALIDA DE PRODUCTOS")
        req.flash('success', 'Registro eliminado con éxito')

        await promisify(connection.commit).call(connection);
        return res.redirect('/salida_productos');

    }catch(error){
        await promisify(connection.rollback).call(connection);
        req.flash('error', 'Error interno del sistema, no se pudo eliminar el registro')
        return res.redirect('/salida_productos/index');
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

module.exports = router;