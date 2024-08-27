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