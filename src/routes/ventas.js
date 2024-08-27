const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const historialAccion = require('../lib/historialAccion');
const kardexStock = require('../lib/kardexStock');
const numeroALetras = require('../lib/numerosLetras');
const QRCode = require('qrcode');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/ventas/');
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
    pagina.actual = 'ventas'

    const ventas = await pool.query("SELECT v.*, c.nombre as n_cliente, u.usuario, DATE_FORMAT(v.fecha_registro, '%Y-%m-%d') as fecha_registro FROM ventas v INNER JOIN clientes c ON c.id = v.cliente_id INNER JOIN users u ON u.id = v.user_id WHERE v.estado = 1");
    res.render('ventas/index', {
        ventas: ventas,
        pagina
    });
});

router.get('/create', async(req, res) => {
    pagina = {};
    pagina.actual = 'ventas';

    
    const clientes = await pool.query("SELECT * FROM clientes WHERE estado = 1");
    const productos = await pool.query("SELECT * FROM productos WHERE estado = 1");

    res.render('ventas/create', {
        pagina: pagina,
        clientes,
        productos
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'ventas';

    let nueva_venta = {
        user_id: req.user.id,
        cliente_id: req.body.cliente_id,
        nit: req.body.nit,
        total: req.body.total,
        descuento: req.body.descuento,
        total_final: req.body.total_final,
        fecha_registro: fechaActual(),
        hora:horaActual(),
    };

    let nr_venta = await pool.query("INSERT INTO ventas SET ?", [nueva_venta]);
    
    let id_productos = req.body['id_productos']
    let cantidades = req.body['cantidades']
    let precios = req.body['precios']
    let subtotales = req.body['subtotales']
    for(let i=0;i<id_productos.length; i++){
        // registr detalle_venta
        const detalle_venta = {
            venta_id: nr_venta.insertId,
            producto_id:id_productos[i],
            cantidad:cantidades[i],
            precio:precios[i],
            subtotal:subtotales[i]
        };
        const detalle = await pool.query("INSERT INTO detalle_ventas SET ? ",[detalle_venta])

        // registrar kardex
        await kardexStock.registroEgreso("VENTA",detalle.insertId, id_productos[i],cantidades[i]);

        // console.log(`ID Producto: ${id_productos[i]}`);
        // console.log(`Cantidad: ${cantidades[i]}`);
        // console.log(`Subtotal: ${subtotales[i]}`);
    }

    await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UNA NUEVA VENTA", nueva_venta,null,"VENTAS")

    req.flash('success', 'Registro éxitoso')
    req.flash('imprimir', venta.id)
    return res.redirect('/ventas/ticket/'+nr_venta.insertId);
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'ventas';
    const {
        id
    } = req.params;
    const ventas = await pool.query("SELECT * FROM ventas WHERE id = ?", [id]);
    const venta = ventas[0];
    const detalle_ventas = await pool.query("SELECT dv.*, p.nombre as p_nombre,p.id as p_id FROM detalle_ventas dv INNER JOIN productos p ON p.id = dv.producto_id WHERE dv.venta_id = ?",[venta.id]);

    const clientes = await pool.query("SELECT * FROM clientes WHERE estado = 1");
    const productos = await pool.query("SELECT * FROM productos WHERE estado = 1");

    res.render('ventas/edit', {
        pagina: pagina,
        venta: venta,
        detalle_ventas,
        clientes,
        productos
    });
});

router.get('/ticket/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'ventas';
    const {
        id
    } = req.params;
    const ventas = await pool.query("SELECT v.*, DATE_FORMAT(v.fecha_registro, '%d/%m/%Y') as fecha_registro, c.nombre as n_cliente, u.usuario FROM ventas v INNER JOIN clientes c ON c.id = v.cliente_id INNER JOIN users u ON u.id = v.user_id WHERE v.id = ?", [id]);
    const venta = ventas[0];

    const detalle_ventas = await pool.query("SELECT dv.*, p.nombre as p_nombre FROM detalle_ventas dv INNER JOIN productos p ON p.id = dv.producto_id WHERE dv.venta_id = ?",[venta.id]);
    let nro_factura = venta.id
    if(nro_factura < 10){
        nro_factura = '0000'+nro_factura;
    }else if(nro_factura < 100){
        nro_factura = '000'+nro_factura;
    }else if(nro_factura < 1000){
        nro_factura = '00'+nro_factura;
    }else if(nro_factura < 10000){
        nro_factura = '0'+nro_factura;
    }

    let letras = numeroALetras.NumerosALetras(venta.total_final);

    let data_qr = `${venta.id}|${venta.n_cliente}|${venta.nit}|${venta.fecha_registro}|${venta.hora}|${venta.total_final}`;
    const qrCodeBase64 = await QRCode.toDataURL(data_qr);

    // const imprimir = venta.id;
    res.render('ventas/ticket', {
        pagina: pagina,
        venta: venta,
        detalle_ventas,
        nro_factura,
        letras,
        qrCodeBase64,
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'ventas';

    const {
        id
    } = req.params;
    const ventas = await pool.query("SELECT * FROM ventas WHERE id = ?", [id]);
    const venta = ventas[0];


    let venta_update = {
        user_id: req.user.id,
        cliente_id: req.body.cliente_id,
        nit: req.body.nit,
        total: req.body.total,
        descuento: req.body.descuento,
        total_final: req.body.total_final,
        fecha_registro: fechaActual(),
        hora:horaActual(),
    };

    let nr_venta = await pool.query("UPDATE ventas SET ? WHERE id = ?", [venta_update, venta.id]);
    let eliminados = req.body['eliminados']
    if(eliminados && eliminados.length > 0){
        for(let i=0;i<eliminados.length; i++){
            let _detalle_ventas = await pool.query("SELECT *  FROM detalle_ventas WHERE id = ?",[eliminados[i]]);
            let dv = _detalle_ventas[0];

            // eliminar kardex
            const registros_kardex = await pool.query("SELECT * FROM kardex_productos WHERE tipo_registro='VENTA' AND registro_id=? AND producto_id=?",[dv.id,dv.producto_id])
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
                siguientes = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? AND id > ?",[dv.producto_id,id_kardex])
                siguiente = siguientes[0]
                if(siguiente){
                    actualiza_desde = siguiente;
                }
            }

            if(actualiza_desde){
                await kardexStock.actualizaRegistrosKardex(actualiza_desde.id, actualiza_desde.producto_id)
            }
            
            // registrar incremento
            await kardexStock.incrementarStock(dv.producto_id,dv.cantidad);

            await pool.query("DELETE FROM detalle_ventas WHERE id = ?",[dv.id]);

        }
    }

    let id_productos = req.body['id_productos']
    let cantidades = req.body['cantidades']
    let precios = req.body['precios']
    let subtotales = req.body['subtotales']
    if(id_productos && id_productos.length > 0){
        for(let i=0;i<id_productos.length; i++){
            // registr detalle_venta
            const detalle_venta = {
                venta_id: venta.id,
                producto_id:id_productos[i],
                cantidad:cantidades[i],
                precio:precios[i],
                subtotal:subtotales[i]
            };
            const detalle = await pool.query("INSERT INTO detalle_ventas SET ? ",[detalle_venta])
    
            // registrar kardex
            await kardexStock.registroEgreso("VENTA",detalle.insertId, id_productos[i],cantidades[i]);
    
            // console.log(`ID Producto: ${id_productos[i]}`);
            // console.log(`Cantidad: ${cantidades[i]}`);
            // console.log(`Subtotal: ${subtotales[i]}`);
        }
    }
    
    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UNA VENTA", venta,venta_update,"VENTAS")
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/ventas');
    
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const ventas = await pool.query("SELECT * FROM ventas WHERE id = ?", [id]);
    const venta = ventas[0];


    const detalle_ventas = await pool.query("SELECT dv.*, p.nombre as p_nombre FROM detalle_ventas dv INNER JOIN productos p ON p.id = dv.producto_id WHERE dv.venta_id = ?",[venta.id]);

    for(item of detalle_ventas){
        let _detalle_ventas = await pool.query("SELECT *  FROM detalle_ventas WHERE id = ?",[item.id]);
        let dv = _detalle_ventas[0];

        // eliminar kardex
        const registros_kardex = await pool.query("SELECT * FROM kardex_productos WHERE tipo_registro='VENTA' AND registro_id=? AND producto_id=?",[dv.id,dv.producto_id])
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
            siguientes = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? AND id > ?",[dv.producto_id,id_kardex])
            siguiente = siguientes[0]
            if(siguiente){
                actualiza_desde = siguiente;
            }
        }

        if(actualiza_desde){
            await kardexStock.actualizaRegistrosKardex(actualiza_desde.id, actualiza_desde.producto_id)
        }
        
        // registrar incremento
        await kardexStock.incrementarStock(dv.producto_id,dv.cantidad);
        await pool.query("DELETE FROM detalle_ventas WHERE id = ?", [dv.id]);
    }

    const result = await pool.query("DELETE FROM ventas WHERE id = ?", [id]);


    await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UNA VENTA", venta,null,"VENTAS")
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/ventas');
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

function horaActual() {
    let date = new Date();

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    // Asegurarse de que los minutos y segundos tengan siempre dos dígitos
    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    if (seconds < 10) seconds = `0${seconds}`;

    let hora = `${hours}:${minutes}:${seconds}`;
    return hora;
}


module.exports = router;