const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const multer = require('multer');
const fs = require('fs');
// exportar modulo y funciones de prediccion
const {entrenamiento,prediccionDatos} = require('../lib/MLPredicciones');

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

// INVENTARIOS
router.get('/inventario',async (req, res) => {
    pagina = {};
    pagina.actual = 'analisis';
    const productos = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro, m.nombre as nombre_marca FROM productos p INNER JOIN marcas m ON p.marca_id = m.id WHERE p.estado = 1");


    const listMeses = [
        {
            key: "01",
            label: "Enero",
        },
        {
            key: "02",
            label: "Febrero",
        },
        {
            key: "03",
            label: "Marzo",
        },
        {
            key: "04",
            label: "Abril",
        },
        {
            key: "05",
            label: "Mayo",
        },
        {
            key: "06",
            label: "Junio",
        },
        {
            key: "07",
            label: "Julio",
        },
        {
            key: "08",
            label: "Agosto",
        },
        {
            key: "09",
            label: "Septiembre",
        },
        {
            key: "10",
            label: "Octubre",
        },
        {
            key: "11",
            label: "Noviembre",
        },
        {
            key: "12",
            label: "Diciembre",
        },
    ]

    res.render('analisis/inventario', {
        pagina: pagina,
        productos,
        listMeses
    });
});

router.get('/stock_productos1', async (req, res) => {
    const {
        id
    } = req.params;
    // const {fecha_ini} =req.query;
    try {
        const productos = await pool.query("SELECT * FROM productos where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of productos){
                const dato = [item.nombre, parseFloat(item.stock_actual)]
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/stock_productos2', async (req, res) => {
    const {
        id
    } = req.params;
    const {fecha_ini, fecha_fin, filtro, producto} =req.query;
    try {
        let productos = [];
        if(filtro !='TODOS' && producto != 'TODOS'){
            productos = await pool.query("SELECT * FROM productos where id = ?",[producto]);
        }else{
            productos = await pool.query("SELECT * FROM productos where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            let fechaIni = new Date(fecha_ini)
            let fechaFin = new Date(fecha_fin)
            fechaFin.setHours(23, 59, 59, 999);
            for(item of productos){
                let auxIni = new Date(fechaIni);
                let data = [];
                while(auxIni <= fechaFin){
                    let fecha_aux = auxIni.toISOString().split('T')[0];
                    let fecha_stocks = await pool.query("SELECT * FROM fecha_stocks WHERE producto_id = ? AND fecha = ?",[item.id,fecha_aux]);
                    let fecha_stock = fecha_stocks[0];
                    let stock = 0;
                    if(fecha_stock){
                        stock = fecha_stock.stock
                    }else{
                        let kardex_productos = await pool.query("SELECT * FROM kardex_productos WHERE producto_id = ?",[item.id])
                        let kardex_producto = kardex_productos[0];
                        if(kardex_producto){
                            stock = kardex_producto.cantidad_saldo;
                        }
                    }

                    data.push(parseFloat(stock))
                    auxIni.setDate(auxIni.getDate() + 1);
                }

                let nuevo_dato = {
                    data: data,
                    name:item.nombre
                };
                datos.push(nuevo_dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/stock_productos3', async (req, res) => {
    const {
        id
    } = req.params;
    const {anio, mes, filtro, producto} =req.query;
    try {
        let productos = [];
        if(filtro !='TODOS' && producto != 'TODOS'){
            productos = await pool.query("SELECT * FROM productos where id = ?",[producto]);
        }else{
            productos = await pool.query("SELECT * FROM productos where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON            
            let datos = [];
            if(req.body.prediccion){
                // REALIZAR PREDICCIÓN
                for(item of productos){
                    // preparar los datos de entrenamiento
                    let prom = 0;
                    // obtener el promedio total de ventas
                    const total_ventas = await pool.query("SELECT dv.*,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM detalle_ventas INNER JOIN ventas v ON v.id = dv.venta_id WHERE dv.producto_id = ?",[item.id])
                    const total_ventas_cantidad = await pool.query("SELECT SUM(cantidad) as cantidad FROM detalle_ventas WHERE producto_id = ? AND",[item.id])
                    if(total_ventas.length > 0){
                        prom = total_ventas_cantidad[0].cantidad / total_ventas.length;
                        prom = prom.toFixed(2);
                    }

                    let data_pred = [];
                    // preparar los datos de entrenamiento
                    // armar los datos de todas las ventas realizads de determinado producto
                    for(dv of total_ventas){
                        let stock_fechas = await pool.query("SELECT * FROM stock_fechas WHERE fecha = ? AND producto_id = ?",[dv.fecha_registro,item.id])
                        if(stock_fechas.legnth > 0){
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: dv.cantidad,
                                currentValue:item.stock_actual
                            });
                        }else{
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: dv.cantidad,
                                currentValue:0
                            });
                        }
                    }
                    // agregar un ultimo datos del promedio y el stock actual
                    data_pred.push({
                        registroId:item.id,
                        historicalValue:parseFloat(prom),
                        currentValue:item.stock_actual
                    });

                    try{
                        const model = entrenamiento(data_pred,[item.id]);
                        // enviar el modelo y la informacion actual
                        let stock_fechas = await pool.query("SELECT * FROM stock_fechas WHERE producto_id = ? ORDER BY id DESC",[item.id])
                        let inputData = [{
                            historicalValue:total_ventas_cantidad,
                            currentValue: item.stock_actual
                        }];
                        if(stock_fechas.length > 0){
                            inputData = [{
                                historicalValue:stock_fechas[0].stock,
                                currentValue:item.stock_actual
                            }];
                        }

                        // ejecutar la funcion de prediccion
                        const predictedStock = await prediccionDatos(model,inputData);
                        // obtener la cantidad obtenida en la prediccion y agregarla para mostrarlo en el gráfico
                        let nueva_data = [item.nombre,parseFloat(predictedStock)];
                        datos.push(nueva_data);
                    }
                    catch(err){
                        console.log(err);
                    }
                }

            }else{
                let fecha_armada = new Date(anio + '-' + mes + '-01');
                // Obtener los meses anteriores
                let mes_anterior1 = new Date(fecha_armada);
                mes_anterior1.setMonth(fecha_armada.getMonth() - 1);
                let mes_anterior2 = new Date(fecha_armada);
                mes_anterior2.setMonth(fecha_armada.getMonth() - 2);
                let mes_anterior3 = new Date(fecha_armada);
                mes_anterior3.setMonth(fecha_armada.getMonth() - 3);
    
                for(item of productos){
                    let prom = 0;
                    let fecha_aux = mes_anterior1.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals1 = await pool.query("SELECT * FROM kardex_productos WHERE producto_id = ? AND fecha LIKE ?",[item.id,fecha_aux])
                    let val1 = vals1[0];
                    if(val1){
                        prom += parseFloat(val1.cantidad_saldo);
                    }
    
                    fecha_aux = mes_anterior2.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals2 = await pool.query("SELECT * FROM kardex_productos WHERE producto_id = ? AND fecha LIKE ?",[item.id,fecha_aux])
                    let val2 = vals2[0];
                    if(val2){
                        prom += parseFloat(val2.cantidad_saldo);
                    }
                    fecha_aux = mes_anterior3.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals3 = await pool.query("SELECT * FROM kardex_productos WHERE producto_id = ? AND fecha LIKE ?",[item.id,fecha_aux])
                    let val3 = vals3[0];
                    if(val3){
                        prom += parseFloat(val3.cantidad_saldo);
                    }   
    
                    prom = prom / 3;
                    prom = ""+prom.toFixed(2);
                    let nuevo_dato = [item.nombre,parseFloat(prom)];
                    datos.push(nuevo_dato);
                }
            }
            const mes_anio = mes + " de " + anio; 

            return res.json({ datos,mes_anio });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

// PROVEEDORES
router.get('/proveedors',async (req, res) => {
    pagina = {};
    pagina.actual = 'analisis';
    const proveedors = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro FROM proveedors p WHERE p.estado = 1");

    const listMeses = [
        {
            key: "01",
            label: "Enero",
        },
        {
            key: "02",
            label: "Febrero",
        },
        {
            key: "03",
            label: "Marzo",
        },
        {
            key: "04",
            label: "Abril",
        },
        {
            key: "05",
            label: "Mayo",
        },
        {
            key: "06",
            label: "Junio",
        },
        {
            key: "07",
            label: "Julio",
        },
        {
            key: "08",
            label: "Agosto",
        },
        {
            key: "09",
            label: "Septiembre",
        },
        {
            key: "10",
            label: "Octubre",
        },
        {
            key: "11",
            label: "Noviembre",
        },
        {
            key: "12",
            label: "Diciembre",
        },
    ]

    res.render('analisis/proveedors', {
        pagina: pagina,
        proveedors,
        listMeses
    });
});

router.get('/proveedors1', async (req, res) => {
    const {
        id
    } = req.params;
    // const {fecha_ini} =req.query;
    try {
        const proveedors = await pool.query("SELECT * FROM proveedors where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of proveedors){
                const ingreso_productos = await pool.query("SELECT SUM(cantidad) as cantidad FROM ingreso_productos WHERE proveedor_id=?",[item.id]);
                const total = ingreso_productos[0].cantidad?ingreso_productos[0].cantidad:0;
                const dato = [item.razon_social, parseFloat(total)]
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/proveedors2', async (req, res) => {
    const {
        id
    } = req.params;
    const {anio, mes, filtro, proveedor} =req.query;
    try {
        let proveedors = [];
        if(filtro !='TODOS' && proveedor != 'TODOS'){
            proveedors = await pool.query("SELECT * FROM proveedors where id = ?",[proveedor]);
        }else{
            proveedors = await pool.query("SELECT * FROM proveedors where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON            
            let datos = [];
            if(req.body.prediccion){
                // REALIZAR PREDICCIÓN
                for(item of proveedors){
                    // preparar los datos de entrenamiento
                    let prom = 0;
                    // obtener el promedio total de ingresos por proveedor
                    const total_ingresos = await pool.query("SELECT ip.*,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM ingreso_productos ip INNER JOIN proveedors p ON p.id = ip.proveedor_id WHERE ip.proveedor_id = ?",[item.proveedor_id])
                    const total_ingresos_cantidad = await pool.query("SELECT SUM(cantidad) as cantidad FROM ingreso_productos WHERE proveedor_id = ? AND",[item.id])
                    if(total_ingresos.length > 0){
                        prom = total_ingresos_cantidad[0].cantidad / total_ingresos.length;
                        prom = prom.toFixed(2);
                    }
                    let data_pred = [];
                    // preparar los datos de entrenamiento
                    // armar los datos de todas las ingresos realizados de determinado registro
                    for(item_value of total_ingresos){
                        let total_cantidad = await pool.query("SELECT SUM(cantidad)as cantidad FROM ingreso_productos WHERE fecha = ? AND proveedor_id = ?",[item_value.fecha_registro,item.id])
                        if(total_cantidad.legnth > 0){
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: total_cantidad[0].cantidad,
                                currentValue:item.cantidad
                            });
                        }else{
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: item_value.cantidad,
                                currentValue:0
                            });
                        }
                    }
                    // agregar un ultimo datos del promedio y cantidad
                    data_pred.push({
                        registroId:item.id,
                        historicalValue:parseFloat(prom),
                        currentValue:item.cantidad
                    });

                    try{
                        const model = entrenamiento(data_pred,[item.id]);

                        // enviar el modelo y la informacion actual
                        let ingreso_productos = await pool.query("SELECT * FROM ingreso_productos WHERE proveedor_id = ? ORDER BY id DESC",[item.id])
                        let inputData = [{
                            historicalValue:total_ingresos_cantidad,
                            currentValue: item.cantidad
                        }];
                        if(ingreso_productos.length > 0){
                            inputData = [{
                                historicalValue:ingreso_productos[0].cantidad,
                                currentValue:item.cantidad
                            }];
                        }

                        // ejecutar la funcion de prediccion
                        const predictedStock = await prediccionDatos(model,inputData);
                        // obtener la cantidad obtenida en la prediccion y agregarla para mostrarlo en el gráfico
                        let nueva_data = [item.nombre,parseFloat(predictedStock)];
                        datos.push(nueva_data);
                    }
                    catch(err){
                        console.log(err);
                    }
                }
            }else{
                let fecha_armada = new Date(anio + '-' + mes + '-01');
                // Obtener los meses anteriores
                let mes_anterior1 = new Date(fecha_armada);
                mes_anterior1.setMonth(fecha_armada.getMonth() - 1);
                let mes_anterior2 = new Date(fecha_armada);
                mes_anterior2.setMonth(fecha_armada.getMonth() - 2);
                let mes_anterior3 = new Date(fecha_armada);
                mes_anterior3.setMonth(fecha_armada.getMonth() - 3);

                for(item of proveedors){
                    let prom = 0;
                    let fecha_aux = mes_anterior1.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals1 = await pool.query("SELECT SUM(cantidad) as cantidad FROM ingreso_productos WHERE proveedor_id = ? AND fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val1 = vals1[0];
                    let t1 = 0;
                    if(val1){
                        t1 = val1.cantidad;
                    }

                    fecha_aux = mes_anterior2.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals2 = await pool.query("SELECT SUM(cantidad) as cantidad FROM ingreso_productos WHERE proveedor_id = ? AND fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val2 = vals2[0];
                    let t2 = 0;
                    if(val2){
                        t2 = val2.cantidad;
                    }
                    fecha_aux = mes_anterior3.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals3 = await pool.query("SELECT SUM(cantidad) as cantidad FROM ingreso_productos WHERE proveedor_id = ? AND fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val3 = vals3[0];
                    let t3 = 0;
                    if(val3){
                        t3 = val3.cantidad;
                    }   

                    prom = (t1 + t2 + t3) / 3;
                    prom = ""+prom.toFixed(2);
                    let nuevo_dato = [item.razon_social,parseFloat(prom)];
                    datos.push(nuevo_dato);
                }
            }            

            const mes_anio = mes + " de " + anio; 

            return res.json({ datos,mes_anio });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/proveedors3', async (req, res) => {
    const {
        id
    } = req.params;
    const {fecha_ini, fecha_fin, filtro, proveedor} =req.query;
    try {
        let proveedors = [];
        if(filtro !='TODOS' && proveedor != 'TODOS'){
            proveedors = await pool.query("SELECT * FROM proveedors where id = ?",[proveedor]);
        }else{
            proveedors = await pool.query("SELECT * FROM proveedors where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of proveedors){
                let vals1 = await pool.query("SELECT SUM(cantidad) as cantidad FROM ingreso_productos WHERE proveedor_id = ? AND fecha_registro BETWEEN ? AND ?",[item.id,fecha_ini,fecha_fin])
                let val1 = vals1[0];
                let total = 0;
                if(val1){
                    total=val1.cantidad
                }
                const dato = [item.razon_social, parseFloat(total)]
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

// VENTAS
router.get('/ventas',async (req, res) => {
    pagina = {};
    pagina.actual = 'analisis';
    const productos = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro, m.nombre as nombre_marca FROM productos p INNER JOIN marcas m ON p.marca_id = m.id WHERE p.estado = 1");
    const listMeses = [
        {
            key: "01",
            label: "Enero",
        },
        {
            key: "02",
            label: "Febrero",
        },
        {
            key: "03",
            label: "Marzo",
        },
        {
            key: "04",
            label: "Abril",
        },
        {
            key: "05",
            label: "Mayo",
        },
        {
            key: "06",
            label: "Junio",
        },
        {
            key: "07",
            label: "Julio",
        },
        {
            key: "08",
            label: "Agosto",
        },
        {
            key: "09",
            label: "Septiembre",
        },
        {
            key: "10",
            label: "Octubre",
        },
        {
            key: "11",
            label: "Noviembre",
        },
        {
            key: "12",
            label: "Diciembre",
        },
    ]

    res.render('analisis/ventas', {
        pagina: pagina,
        productos,
        listMeses
    });
});

router.get('/ventas1', async (req, res) => {
    const {
        id
    } = req.params;
    // const {fecha_ini} =req.query;
    try {
        const productos = await pool.query("SELECT * FROM productos where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of productos){
                const detalle_ventas = await pool.query("SELECT SUM(cantidad) as cantidad FROM detalle_ventas WHERE producto_id = ?",[item.id]);
                const detalle = detalle_ventas[0];
                let total = 0;
                if(detalle){
                    total = detalle.cantidad;
                }
                const dato = [item.nombre,parseFloat(total)];
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/ventas2', async (req, res) => {
    const {
        id
    } = req.params;
    // const {fecha_ini} =req.query;
    try {
        const productos = await pool.query("SELECT * FROM productos where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of productos){
                const detalle_ventas = await pool.query("SELECT SUM(subtotal) as subtotal FROM detalle_ventas WHERE producto_id = ?",[item.id]);
                const detalle = detalle_ventas[0];
                let total = 0;
                if(detalle){
                    total = detalle.subtotal;
                }
                const dato = [item.nombre,parseFloat(total)];
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/ventas3', async (req, res) => {
    const {
        id
    } = req.params;
    const {fecha_ini, fecha_fin, filtro, producto} =req.query;
    try {
        let productos = [];
        if(filtro !='TODOS' && producto != 'TODOS'){
            productos = await pool.query("SELECT * FROM productos where id = ?",[producto]);
        }else{
            productos = await pool.query("SELECT * FROM productos where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of productos){
                const detalle_ventas = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id WHERE producto_id = ? AND fecha_registro BETWEEN ? AND ?",[item.id,fecha_ini,fecha_fin]);
                const detalle = detalle_ventas[0];
                let total = 0;
                if(detalle){
                    total = detalle.cantidad;
                }
                const nuevo_dato = [item.nombre,parseFloat(total)];
                datos.push(nuevo_dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/ventas4', async (req, res) => {
    const {
        id
    } = req.params;
    const {fecha_ini, fecha_fin, filtro, producto} =req.query;
    try {
        let productos = [];
        if(filtro !='TODOS' && producto != 'TODOS'){
            productos = await pool.query("SELECT * FROM productos where id = ?",[producto]);
        }else{
            productos = await pool.query("SELECT * FROM productos where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of productos){
                const detalle_ventas = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id WHERE producto_id = ? AND fecha_registro BETWEEN ? AND ?",[item.id,fecha_ini,fecha_fin]);
                const detalle = detalle_ventas[0];
                let total = 0;
                if(detalle){
                    total = detalle.subtotal;
                }
                const nuevo_dato = [item.nombre,parseFloat(total)];
                datos.push(nuevo_dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/ventas5', async (req, res) => {
    const {
        id
    } = req.params;
    const {anio, mes, filtro, producto} =req.query;
    try {
        let productos = [];
        if(filtro !='TODOS' && producto != 'TODOS'){
            productos = await pool.query("SELECT * FROM productos where id = ?",[producto]);
        }else{
            productos = await pool.query("SELECT * FROM productos where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON            
            let datos = [];
            if(req.body.prediccion){
                // REALIZAR PREDICCIÓN
                for(item of productos){
                    // preparar los datos de entrenamiento
                    let prom = 0;
                    // obtener el promedio total de cantidad vendida por producto
                    const total_ingresos = await pool.query("SELECT dv.*,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE dv.producto_id = ?",[item.producto_id])
                    const total_ingresos_cantidad = await pool.query("SELECT SUM(cantidad) as cantidad FROM detalle_ventas WHERE producto_id = ? AND",[item.id])
                    if(total_ingresos.length > 0){
                        prom = total_ingresos_cantidad[0].cantidad / total_ingresos.length;
                        prom = prom.toFixed(2);
                    }
                    let data_pred = [];
                    // preparar los datos de entrenamiento
                    // armar los datos de todas las ingresos realizados de determinado registro
                    for(item_value of total_ingresos){
                        let total_cantidad = await pool.query("SELECT SUM(cantidad)as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id  WHERE fecha_registro = ? AND producto_id = ?",[item_value.fecha_registro,item.id])
                        if(total_cantidad.legnth > 0){
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: total_cantidad[0].cantidad,
                                currentValue:item.cantidad
                            });
                        }else{
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: item_value.cantidad,
                                currentValue:0
                            });
                        }
                    }
                    // agregar un ultimo datos del promedio y cantidad
                    data_pred.push({
                        registroId:item.id,
                        historicalValue:parseFloat(prom),
                        currentValue:item.cantidad
                    });

                    try{
                        const model = entrenamiento(data_pred,[item.id]);

                        // enviar el modelo y la informacion actual
                        let detalle_ventas = await pool.query("SELECT * FROM detalle_ventas WHERE producto_id = ? ORDER BY id DESC",[item.id])
                        let inputData = [{
                            historicalValue:total_ingresos_cantidad,
                            currentValue: item.cantidad
                        }];
                        if(detalle_ventas.length > 0){
                            inputData = [{
                                historicalValue:detalle_ventas[0].cantidad,
                                currentValue:item.cantidad
                            }];
                        }

                        // ejecutar la funcion de prediccion
                        const predictedStock = await prediccionDatos(model,inputData);
                        // obtener la cantidad obtenida en la prediccion y agregarla para mostrarlo en el gráfico
                        let nueva_data = [item.nombre,parseFloat(predictedStock)];
                        datos.push(nueva_data);
                    }
                    catch(err){
                        console.log(err);
                    }
                }
            }else{
                let fecha_armada = new Date(anio + '-' + mes + '-01');
                // Obtener los meses anteriores
                let mes_anterior1 = new Date(fecha_armada);
                mes_anterior1.setMonth(fecha_armada.getMonth() - 1);
                let mes_anterior2 = new Date(fecha_armada);
                mes_anterior2.setMonth(fecha_armada.getMonth() - 2);
                let mes_anterior3 = new Date(fecha_armada);
                mes_anterior3.setMonth(fecha_armada.getMonth() - 3);

                for(item of productos){
                    let prom = 0;
                    let fecha_aux = mes_anterior1.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals1 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE producto_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val1 = vals1[0];
                    if(val1){
                        prom += parseFloat(val1.cantidad?val1.cantidad:0);
                    }

                    fecha_aux = mes_anterior2.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals2 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE producto_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val2 = vals2[0];
                    if(val2){
                        prom += parseFloat(val2.cantidad?val2.cantidad:0);
                    }
                    fecha_aux = mes_anterior3.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals3 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE producto_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val3 = vals3[0];
                    if(val3){
                        prom += parseFloat(val3.cantidad?val3.cantidad:0);
                    }   

                    prom = prom / 3;
                    prom = ""+prom.toFixed(2);
                    let nuevo_dato = [item.nombre,parseFloat(prom)];
                    datos.push(nuevo_dato);
                }
            }            
            const mes_anio = mes + " de " + anio; 
            return res.json({ datos,mes_anio });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/ventas6', async (req, res) => {
    const {
        id
    } = req.params;
    const {anio, mes, filtro, producto} =req.query;
    try {
        let productos = [];
        if(filtro !='TODOS' && producto != 'TODOS'){
            productos = await pool.query("SELECT * FROM productos where id = ?",[producto]);
        }else{
            productos = await pool.query("SELECT * FROM productos where estado = 1");
        }
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON            
            let datos = [];
            if(req.body.prediccion){
                // REALIZAR PREDICCIÓN
                for(item of productos){
                    // preparar los datos de entrenamiento
                    let prom = 0;
                    // obtener el promedio total de subtotal vendida por producto
                    const total_ingresos = await pool.query("SELECT dv.*,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE dv.producto_id = ?",[item.producto_id])
                    const total_ingresos_subtotal = await pool.query("SELECT SUM(subtotal) as subtotal FROM detalle_ventas WHERE producto_id = ? AND",[item.id])
                    if(total_ingresos.length > 0){
                        prom = total_ingresos_subtotal[0].subtotal / total_ingresos.length;
                        prom = prom.toFixed(2);
                    }
                    let data_pred = [];
                    // preparar los datos de entrenamiento
                    // armar los datos de todas las ingresos realizados de determinado registro
                    for(item_value of total_ingresos){
                        let total_subtotal = await pool.query("SELECT SUM(subtotal)as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id  WHERE fecha_registro = ? AND producto_id = ?",[item_value.fecha_registro,item.id])
                        if(total_subtotal.legnth > 0){
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: total_subtotal[0].subtotal,
                                currentValue:item.subtotal
                            });
                        }else{
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: item_value.subtotal,
                                currentValue:0
                            });
                        }
                    }
                    // agregar un ultimo datos del promedio y subtotal
                    data_pred.push({
                        registroId:item.id,
                        historicalValue:parseFloat(prom),
                        currentValue:item.subtotal
                    });

                    try{
                        const model = entrenamiento(data_pred,[item.id]);

                        // enviar el modelo y la informacion actual
                        let detalle_ventas = await pool.query("SELECT * FROM detalle_ventas WHERE producto_id = ? ORDER BY id DESC",[item.id])
                        let inputData = [{
                            historicalValue:total_ingresos_subtotal,
                            currentValue: item.subtotal
                        }];
                        if(detalle_ventas.length > 0){
                            inputData = [{
                                historicalValue:detalle_ventas[0].subtotal,
                                currentValue:item.subtotal
                            }];
                        }

                        // ejecutar la funcion de prediccion
                        const predictedStock = await prediccionDatos(model,inputData);
                        // obtener la subtotal obtenido en la prediccion y agregarla para mostrarlo en el gráfico
                        let nueva_data = [item.nombre,parseFloat(predictedStock)];
                        datos.push(nueva_data);
                    }
                    catch(err){
                        console.log(err);
                    }
                }
            }else{
                let fecha_armada = new Date(anio + '-' + mes + '-01');
                // Obtener los meses anteriores
                let mes_anterior1 = new Date(fecha_armada);
                mes_anterior1.setMonth(fecha_armada.getMonth() - 1);
                let mes_anterior2 = new Date(fecha_armada);
                mes_anterior2.setMonth(fecha_armada.getMonth() - 2);
                let mes_anterior3 = new Date(fecha_armada);
                mes_anterior3.setMonth(fecha_armada.getMonth() - 3);

                for(item of productos){
                    let prom = 0;
                    let fecha_aux = mes_anterior1.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals1 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE producto_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val1 = vals1[0];
                    if(val1){
                        prom += parseFloat(val1.subtotal?val1.subtotal:0);
                    }

                    fecha_aux = mes_anterior2.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals2 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE producto_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val2 = vals2[0];
                    if(val2){
                        prom += parseFloat(val2.subtotal?val2.subtotal:0);
                    }
                    fecha_aux = mes_anterior3.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";
                    let vals3 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE producto_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                    let val3 = vals3[0];
                    if(val3){
                        prom += parseFloat(val3.subtotal?val3.subtotal:0);
                    }   

                    prom = prom / 3;
                    prom = ""+prom.toFixed(2);
                    let nuevo_dato = [item.nombre,parseFloat(prom)];
                    datos.push(nuevo_dato);
                }
            }            
            const mes_anio = mes + " de " + anio; 
            return res.json({ datos,mes_anio });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

// CLIENTES
router.get('/clientes',async (req, res) => {
    pagina = {};
    pagina.actual = 'analisis';
    const productos = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro, m.nombre as nombre_marca FROM productos p INNER JOIN marcas m ON p.marca_id = m.id WHERE p.estado = 1");
    const listMeses = [
        {
            key: "01",
            label: "Enero",
        },
        {
            key: "02",
            label: "Febrero",
        },
        {
            key: "03",
            label: "Marzo",
        },
        {
            key: "04",
            label: "Abril",
        },
        {
            key: "05",
            label: "Mayo",
        },
        {
            key: "06",
            label: "Junio",
        },
        {
            key: "07",
            label: "Julio",
        },
        {
            key: "08",
            label: "Agosto",
        },
        {
            key: "09",
            label: "Septiembre",
        },
        {
            key: "10",
            label: "Octubre",
        },
        {
            key: "11",
            label: "Noviembre",
        },
        {
            key: "12",
            label: "Diciembre",
        },
    ]

    res.render('analisis/clientes', {
        pagina: pagina,
        productos,
        listMeses
    });
});

router.get('/clientes1', async (req, res) => {
    const {
        id
    } = req.params;
    // const {fecha_ini} =req.query;
    try {
        const clientes = await pool.query("SELECT * FROM clientes where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of clientes){
                const detalle_ventas = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ?",[item.id]);
                const detalle = detalle_ventas[0];
                let total = 0;
                if(detalle){
                    total = detalle.cantidad;
                }
                const dato = [item.nombre,parseFloat(total)];
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/clientes2', async (req, res) => {
    const {
        id
    } = req.params;
    // const {fecha_ini} =req.query;
    try {
        const clientes = await pool.query("SELECT * FROM clientes where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of clientes){
                const detalle_ventas = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ?",[item.id]);
                const detalle = detalle_ventas[0];
                let total = 0;
                if(detalle){
                    total = detalle.subtotal;
                }
                const dato = [item.nombre,parseFloat(total)];
                datos.push(dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/clientes3', async (req, res) => {
    const {
        id
    } = req.params;
    const {fecha_ini, fecha_fin, filtro, producto} =req.query;
    try {
        const clientes = await pool.query("SELECT * FROM clientes where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of clientes){
                let total = 0;
                if(filtro !='TODOS' && producto != 'TODOS'){
                    const detalle_ventas = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id WHERE producto_id = ? AND cliente_id = ? AND fecha_registro BETWEEN ? AND ?",[producto,item.id,fecha_ini,fecha_fin]);
                    const detalle = detalle_ventas[0];
                    if(detalle){
                        total = detalle.cantidad;
                    }
                }else{
                    const detalle_ventas = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id WHERE cliente_id = ? AND fecha_registro BETWEEN ? AND ?",[item.id, fecha_ini,fecha_fin]);
                    const detalle = detalle_ventas[0];
                    if(detalle){
                        total = detalle.cantidad;
                    }
                }
                const nuevo_dato = [item.nombre,parseFloat(total)];
                datos.push(nuevo_dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/clientes4', async (req, res) => {
    const {
        id
    } = req.params;
    const {fecha_ini, fecha_fin, filtro, producto} =req.query;
    try {
        const clientes = await pool.query("SELECT * FROM clientes where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            let datos = [];
            for(item of clientes){
                let total = 0;
                if(filtro !='TODOS' && producto != 'TODOS'){
                    const detalle_ventas = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id WHERE producto_id = ? AND cliente_id = ? AND fecha_registro BETWEEN ? AND ?",[producto,item.id,fecha_ini,fecha_fin]);
                    const detalle = detalle_ventas[0];
                    if(detalle){
                        total = detalle.subtotal;
                    }
                }else{
                    const detalle_ventas = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id WHERE cliente_id = ? AND fecha_registro BETWEEN ? AND ?",[item.id, fecha_ini,fecha_fin]);
                    const detalle = detalle_ventas[0];
                    if(detalle){
                        total = detalle.subtotal;
                    }
                }
                const nuevo_dato = [item.nombre,parseFloat(total)];
                datos.push(nuevo_dato);
            }
            return res.json({ datos });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/clientes5', async (req, res) => {
    const {
        id
    } = req.params;
    const {anio, mes, filtro, producto} =req.query;
    try {
        const clientes = await pool.query("SELECT * FROM clientes where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON            
            let datos = [];
            if(req.body.prediccion){
                // REALIZAR PREDICCIÓN
                for(item of clientes){
                    // preparar los datos de entrenamiento
                    let prom = 0;
                    // obtener el promedio total de cantidad vendida por producto
                    const total_cliente = await pool.query("SELECT dv.*,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id  WHERE v.cliente_id = ?",[item.id])
                    const total_cliente_cantidad = await pool.query("SELECT SUM(cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE cliente_id = ? AND",[item.id])
                    if(total_cliente.length > 0){
                        prom = total_cliente_cantidad[0].cantidad / total_cliente.length;
                        prom = prom.toFixed(2);
                    }
                    let data_pred = [];
                    // preparar los datos de entrenamiento
                    // armar los datos del total de productos comprados por cliente realizados de determinado registro
                    for(item_value of total_cliente){
                        let total_cantidad = await pool.query("SELECT SUM(cantidad)as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id  WHERE fecha_registro = ? AND cliente_id = ?",[item_value.fecha_registro,item.id])
                        if(total_cantidad.legnth > 0){
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: total_cantidad[0].cantidad,
                                currentValue:item.cantidad
                            });
                        }else{
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: item_value.cantidad,
                                currentValue:0
                            });
                        }
                    }
                    // agregar un ultimo datos del promedio y cantidad
                    data_pred.push({
                        registroId:item.id,
                        historicalValue:parseFloat(prom),
                        currentValue:item.cantidad
                    });

                    try{
                        const model = entrenamiento(data_pred,[item.id]);

                        // enviar el modelo y la informacion actual
                        let detalle_ventas = await pool.query("SELECT * FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE cliente_id = ? ORDER BY id DESC",[item.id])
                        let inputData = [{
                            historicalValue:total_cliente_cantidad,
                            currentValue: item.cantidad
                        }];
                        if(detalle_ventas.length > 0){
                            inputData = [{
                                historicalValue:detalle_ventas[0].cantidad,
                                currentValue:item.cantidad
                            }];
                        }

                        // ejecutar la funcion de prediccion
                        const predictedStock = await prediccionDatos(model,inputData);
                        // obtener la cantidad obtenida en la prediccion y agregarla para mostrarlo en el gráfico
                        let nueva_data = [item.nombre,parseFloat(predictedStock)];
                        datos.push(nueva_data);
                    }
                    catch(err){
                        console.log(err);
                    }
                }
            }else{
                let fecha_armada = new Date(anio + '-' + mes + '-01');
                // Obtener los meses anteriores
                let mes_anterior1 = new Date(fecha_armada);
                mes_anterior1.setMonth(fecha_armada.getMonth() - 1);
                let mes_anterior2 = new Date(fecha_armada);
                mes_anterior2.setMonth(fecha_armada.getMonth() - 2);
                let mes_anterior3 = new Date(fecha_armada);
                mes_anterior3.setMonth(fecha_armada.getMonth() - 3);

                for(item of clientes){
                    let prom = 0;
                    let fecha_aux = mes_anterior1.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";

                    if(filtro != 'TODOS' && producto != 'TODOS'){
                        let vals1 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND dv.producto_id = ? AND v.fecha_registro LIKE ?",[item.id,producto,fecha_aux])
                        let val1 = vals1[0];
                        if(val1){
                            prom += parseFloat(val1.cantidad?val1.cantidad:0);
                        }
        
                        fecha_aux = mes_anterior2.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals2 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND dv.producto_id = ? AND v.fecha_registro LIKE ?",[item.id,producto,fecha_aux])
                        let val2 = vals2[0];
                        if(val2){
                            prom += parseFloat(val2.cantidad?val2.cantidad:0);
                        }
                        fecha_aux = mes_anterior3.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals3 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND dv.producto_id = ? AND v.fecha_registro LIKE ?",[item.id,producto,fecha_aux])
                        let val3 = vals3[0];
                        if(val3){
                            prom += parseFloat(val3.cantidad?val3.cantidad:0);
                        }   
                    }else{
                        let vals1 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                        let val1 = vals1[0];
                        if(val1){
                            prom += parseFloat(val1.cantidad?val1.cantidad:0);
                        }
        
                        fecha_aux = mes_anterior2.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals2 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                        let val2 = vals2[0];
                        if(val2){
                            prom += parseFloat(val2.cantidad?val2.cantidad:0);
                        }
                        fecha_aux = mes_anterior3.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals3 = await pool.query("SELECT SUM(dv.cantidad) as cantidad FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                        let val3 = vals3[0];
                        if(val3){
                            prom += parseFloat(val3.cantidad?val3.cantidad:0);
                        }   
                    }
        
                    prom = prom / 3;
                    prom = ""+prom.toFixed(2);
                    let nuevo_dato = [item.nombre,parseFloat(prom)];
                    datos.push(nuevo_dato);
                }
            }            
            const mes_anio = mes + " de " + anio; 
            return res.json({ datos,mes_anio });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
    }
});

router.get('/clientes6', async (req, res) => {
    const {
        id
    } = req.params;
    const {anio, mes, filtro, producto} =req.query;
    try {
        const clientes = await pool.query("SELECT * FROM clientes where estado = 1");
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON            
            let datos = [];
            
            if(req.body.prediccion){
                // REALIZAR PREDICCIÓN
                for(item of clientes){
                    // preparar los datos de entrenamiento
                    let prom = 0;
                    // obtener el promedio total de ingresos vendida por producto
                    const total_cliente = await pool.query("SELECT dv.*,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id  WHERE v.cliente_id = ?",[item.id])
                    const subtotal = await pool.query("SELECT SUM(subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE cliente_id = ? AND",[item.id])
                    if(total_cliente.length > 0){
                        prom = subtotal[0].subtotal / total_cliente.length;
                        prom = prom.toFixed(2);
                    }
                    let data_pred = [];
                    // preparar los datos de entrenamiento
                    // armar los datos del total de productos comprados por cliente realizados de determinado registro
                    for(item_value of total_cliente){
                        let subtotal = await pool.query("SELECT SUM(subtotal)as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id=dv.venta_id  WHERE fecha_registro = ? AND cliente_id = ?",[item_value.fecha_registro,item.id])
                        if(subtotal.legnth > 0){
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: subtotal[0].subtotal,
                                currentValue:item.subtotal
                            });
                        }else{
                            data_pred.push({
                                registroId:item.id,
                                historicalValue: item_value.subtotal,
                                currentValue:0
                            });
                        }
                    }
                    // agregar un ultimo datos del promedio y subtotal
                    data_pred.push({
                        registroId:item.id,
                        historicalValue:parseFloat(prom),
                        currentValue:item.subtotal
                    });

                    try{
                        const model = entrenamiento(data_pred,[item.id]);

                        // enviar el modelo y la informacion actual
                        let detalle_ventas = await pool.query("SELECT * FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE cliente_id = ? ORDER BY id DESC",[item.id])
                        let inputData = [{
                            historicalValue:subtotal,
                            currentValue: item.subtotal
                        }];
                        if(detalle_ventas.length > 0){
                            inputData = [{
                                historicalValue:detalle_ventas[0].subtotal,
                                currentValue:item.subtotal
                            }];
                        }

                        // ejecutar la funcion de prediccion
                        const predictedStock = await prediccionDatos(model,inputData);
                        // obtener el ingreso total obtenido en la prediccion y agregarla para mostrarlo en el gráfico
                        let nueva_data = [item.nombre,parseFloat(predictedStock)];
                        datos.push(nueva_data);
                    }
                    catch(err){
                        console.log(err);
                    }
                }
            }else{
                let fecha_armada = new Date(anio + '-' + mes + '-01');
                // Obtener los meses anteriores
                let mes_anterior1 = new Date(fecha_armada);
                mes_anterior1.setMonth(fecha_armada.getMonth() - 1);
                let mes_anterior2 = new Date(fecha_armada);
                mes_anterior2.setMonth(fecha_armada.getMonth() - 2);
                let mes_anterior3 = new Date(fecha_armada);
                mes_anterior3.setMonth(fecha_armada.getMonth() - 3);

                for(item of clientes){
                    let prom = 0;
                    let fecha_aux = mes_anterior1.toISOString().split('T')[0];
                    fecha_aux = fecha_aux.substring(0,7)+"%";

                    if(filtro != 'TODOS' && producto != 'TODOS'){
                        let vals1 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND dv.producto_id = ? AND v.fecha_registro LIKE ?",[item.id,producto,fecha_aux])
                        let val1 = vals1[0];
                        if(val1){
                            prom += parseFloat(val1.subtotal?val1.subtotal:0);
                        }
        
                        fecha_aux = mes_anterior2.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals2 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND dv.producto_id = ? AND v.fecha_registro LIKE ?",[item.id,producto,fecha_aux])
                        let val2 = vals2[0];
                        if(val2){
                            prom += parseFloat(val2.subtotal?val2.subtotal:0);
                        }
                        fecha_aux = mes_anterior3.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals3 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND dv.producto_id = ? AND v.fecha_registro LIKE ?",[item.id,producto,fecha_aux])
                        let val3 = vals3[0];
                        if(val3){
                            prom += parseFloat(val3.subtotal?val3.subtotal:0);
                        }   
                    }else{
                        let vals1 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                        let val1 = vals1[0];
                        if(val1){
                            prom += parseFloat(val1.subtotal?val1.subtotal:0);
                        }
        
                        fecha_aux = mes_anterior2.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals2 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                        let val2 = vals2[0];
                        if(val2){
                            prom += parseFloat(val2.subtotal?val2.subtotal:0);
                        }
                        fecha_aux = mes_anterior3.toISOString().split('T')[0];
                        fecha_aux = fecha_aux.substring(0,7)+"%";
                        let vals3 = await pool.query("SELECT SUM(dv.subtotal) as subtotal FROM detalle_ventas dv INNER JOIN ventas v ON v.id = dv.venta_id WHERE v.cliente_id = ? AND v.fecha_registro LIKE ?",[item.id,fecha_aux])
                        let val3 = vals3[0];
                        if(val3){
                            prom += parseFloat(val3.subtotal?val3.subtotal:0);
                        }   
                    }
        
                    prom = prom / 3;
                    prom = ""+prom.toFixed(2);
                    let nuevo_dato = [item.nombre,parseFloat(prom)];
                    datos.push(nuevo_dato);
                }
            }            
            const mes_anio = mes + " de " + anio; 
            return res.json({ datos,mes_anio });
        } else{
            return res.status(400).json({ error: 'No se cargaron datgos' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener los registros.' });
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