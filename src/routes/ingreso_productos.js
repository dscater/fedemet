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
        cb(null, 'src/public/imgs/ingreso_productos/');
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
    pagina.actual = 'ingreso_productos'

    const ingreso_productos = await pool.query("SELECT ip.*, p.nombre as p_nombre, prov.razon_social, ti.nombre as ti_nombre,DATE_FORMAT(ip.fecha_registro, '%Y-%m-%d') as fecha_registro FROM ingreso_productos ip INNER JOIN productos p ON ip.producto_id = p.id INNER JOIN proveedors prov ON  prov.id = ip.proveedor_id INNER JOIN tipo_ingresos ti ON ti.id = ip.tipo_ingreso_id WHERE p.estado = 1");
    res.render('ingreso_productos/index', {
        ingreso_productos: ingreso_productos,
        pagina
    });
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'ingreso_productos';

    const productos = await pool.query("SELECT p.* FROM productos p WHERE p.estado = 1");
    const tipo_ingresos = await pool.query("SELECT * FROM tipo_ingresos");
    const proveedors = await pool.query("SELECT * FROM proveedors WHERE estado = 1");
    res.render('ingreso_productos/create', {
        pagina: pagina,
        proveedors,
        productos,
        tipo_ingresos
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'ingreso_productos';

    let nuevo_ingreso_producto = {
        producto_id:req.body.producto_id,
        proveedor_id:req.body.proveedor_id,
        precio_compra:req.body.precio_compra,
        cantidad:req.body.cantidad,
        tipo_ingreso_id:req.body.tipo_ingreso_id,
        descripcion: req.body.descripcion.toUpperCase(),
        fecha_registro:fechaActual()
    };
   // iniciar transaccion
    const connection = await pool.getConnection();
    try{
        await promisify(connection.beginTransaction).call(connection); // Inicia la transacción

        let nr_ingreso_producto = await pool.query("INSERT INTO ingreso_productos SET ?", [nuevo_ingreso_producto]);
        // kardex
        await kardexStock.registroIngreso("INGRESO",nr_ingreso_producto.insertId, req.body.producto_id,req.body.cantidad);

        await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN NUEVO INGRESO DE PRODUCTO", nuevo_ingreso_producto,null,"INGRESO DE PRODUCTOS")
        await promisify(connection.commit).call(connection);
        req.flash('success', 'Registro éxitoso')
        return res.redirect('/ingreso_productos');
    }catch(error){
        await promisify(connection.rollback).call(connection);
        req.flash('error', 'Error interno del sistema, no se pudo guardar el registro')
        return res.redirect('/ingreso_productos/create');
    }
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'ingreso_productos';
    const {
        id
    } = req.params;
    const ingreso_productos = await pool.query("SELECT ip.*, p.nombre as p_nombre FROM ingreso_productos ip INNER JOIN productos p ON p.id = ip.producto_id WHERE ip.id = ?", [id]);
    const ingreso_producto = ingreso_productos[0];

    const tipo_ingresos = await pool.query("SELECT * FROM tipo_ingresos");
    const proveedors = await pool.query("SELECT * FROM proveedors WHERE estado = 1");

    res.render('ingreso_productos/edit', {
        pagina: pagina,
        ingreso_producto: ingreso_producto,
        proveedors,
        tipo_ingresos
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'ingreso_productos';

    const {
        id
    } = req.params;

    // iniciar transaccion
    const connection = await pool.getConnection();
    try{
        await promisify(connection.beginTransaction).call(connection); // Inicia la transacción

        const ingreso_productos = await pool.query("SELECT * FROM ingreso_productos WHERE id = ?", [id]);
        const ingreso_producto = ingreso_productos[0];
    
        // decrementar stock
        await kardexStock.decrementarStock(ingreso_producto.producto_id,ingreso_producto.cantidad)
    
        let ingreso_producto_update = {
            proveedor_id:req.body.proveedor_id,
            precio_compra:req.body.precio_compra,
            cantidad:req.body.cantidad,
            tipo_ingreso_id:req.body.tipo_ingreso_id,
            descripcion: req.body.descripcion.toUpperCase(),
        };
    
        // actualizar ingreso
        await pool.query("UPDATE ingreso_productos SET ? WHERE id = ?", [ingreso_producto_update, ingreso_producto.id]);
    
        // incrementar stock
        await kardexStock.incrementarStock(ingreso_producto.producto_id,ingreso_producto_update.cantidad)

        // actualizar kardex
        let kardexs = await pool.query("SELECT * FROM kardex_productos WHERE tipo_registro='INGRESO' AND registro_id=? AND producto_id=?",[ingreso_producto.id,ingreso_producto.producto_id])
        let kardex = kardexs[0]
        let res_actualizacion = await kardexStock.actualizaRegistrosKardex(kardex.id,kardex.producto_id);
        if(!res_actualizacion){
            throw new "Error al actualizar el registro";
        }
    
        await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UN INGRESO DE PRODUCTO", ingreso_producto,ingreso_producto_update,"INGRESO DE PRODUCTOS")
        await promisify(connection.commit).call(connection);
        req.flash('success', 'Registro modificado con éxito')
        return res.redirect('/ingreso_productos');

    }catch(error){
        await promisify(connection.rollback).call(connection);
        req.flash('error', 'Error interno del sistema, no se pudo actualizar el registro')
        return res.redirect('/ingreso_productos/edit/'+ id);
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
        const ingreso_productos = await pool.query("SELECT * FROM ingreso_productos WHERE id = ?", [id]);
        const ingreso_producto = ingreso_productos[0];

        const registros_kardex = await pool.query("SELECT * FROM kardex_productos WHERE tipo_registro='INGRESO' AND registro_id=? AND producto_id=?",[ingreso_producto.id,ingreso_producto.producto_id])
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
            siguientes = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? AND id > ?",[ingreso_producto.producto_id,id_kardex])
            siguiente = siguientes[0]
            if(siguiente){
                actualiza_desde = siguiente;
            }
        }

        if(actualiza_desde){
            await kardexStock.actualizaRegistrosKardex(actualiza_desde.id, actualiza_desde.producto_id)
        }
        
        // registrar decremento
        await kardexStock.decrementarStock(ingreso_producto.producto_id,ingreso_producto.cantidad);

        const result = await pool.query("DELETE FROM ingreso_productos WHERE id = ?", [id]);
        await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UN INGRESO DE PRODUCTO", ingreso_producto,null,"INGRESO DE PRODUCTOS")
        req.flash('success', 'Registro eliminado con éxito')

        await promisify(connection.commit).call(connection);
        return res.redirect('/ingreso_productos');

    }catch(error){
        await promisify(connection.rollback).call(connection);
        req.flash('error', 'Error interno del sistema, no se pudo eliminar el registro')
        return res.redirect('/ingreso_productos/index');
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