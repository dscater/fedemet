const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const puppeteer = require('puppeteer');
const hbs = require('handlebars');
const fs = require('fs-extra');

// Helper para incrementar un contador
hbs.registerHelper('contador', function (index) {
    return index + 1;
});


const compile = async function (templateName, data) {
    var templateHtml = await fs.readFile(path.join(process.cwd(), `src/views/reportes/template_pdfs/${templateName}.hbs`), 'utf8');
    var html = hbs.compile(templateHtml)({
        datos: data
    });
    return html
};

// funcion para generar los pdfs
const generaPDF = async function (archivo, datos, nomFile, tamanio, orientacion,titulo = 'Reporte') {
    let filename = '';
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const content = await compile(archivo, datos);
        await page.setContent(content);
        await page.emulateMediaType('screen');
        filename = `src/public/files/${nomFile}`;

        txt_html = `<div style="font-size: 8px; padding-top: 0px; padding-right:13px; text-align:right; width: 100%;">
        <span>pág.</span> <span class="pageNumber"></span>
        </div>
    `;

        await page.pdf({
            title: titulo,
            landscape: orientacion,
            path: filename,
            format: tamanio,
            displayHeaderFooter: true,
            headerTemplate: txt_html,
            printBackground: true
        });

        console.log('PDF CORRETO');
        await browser.close();
    } catch (e) {
        console.log('ERRROR PDF', e);
    }
    return filename;
}

// rutas reportes
router.get('/usuarios', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    let fecha = fechaActual();

    res.render('reportes/usuarios', {
        pagina,
        fecha
    });
});
router.get('/stock_productos', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    let fecha = fechaActual();

    res.render('reportes/stock_productos', {
        pagina,
        fecha
    });
});
router.get('/kardex_productos', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    let fecha = fechaActual();

    const productos = await pool.query("SELECT id, nombre FROM productos WHERE estado = 1");
    const marcas = await pool.query("SELECT id, nombre FROM marcas WHERE estado = 1");

    res.render('reportes/kardex_productos', {
        pagina,
        fecha,
        productos,
        marcas
    });
});

router.get('/ventas', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    let fecha = fechaActual();

    const productos = await pool.query("SELECT id, nombre FROM productos WHERE estado = 1");
    const marcas = await pool.query("SELECT id, nombre FROM marcas WHERE estado = 1");

    res.render('reportes/ventas', {
        pagina,
        fecha,
        productos,
        marcas
    });
});


// rutas pdf
router.get('/pdf/usuarios', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];

    let filtro = req.query.filtro;
    let tipo = req.query.tipo;

    var usuarios = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM users WHERE estado = 1 AND id != 1");
    if (filtro != 'todos') {
        if (tipo != 'todos') {
            usuarios = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM users WHERE estado = 1 AND id != 1 AND tipo = ?", [tipo]);
        }
    }


    let datos = {};
    datos.usuarios = usuarios;
    datos.configuracion = configuracion;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();

    let url_file = await generaPDF('usuarios', datos, 'Usuarios.pdf', 'A4', true);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/pdf/stock_productos', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];

    // let filtro = req.query.filtro;
    // let tipo = req.query.tipo;

    var productos = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM productos WHERE estado = 1");

    let datos = {};
    datos.productos = productos;
    datos.configuracion = configuracion;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();

    let url_file = await generaPDF('stock_productos', datos, 'StockProductos.pdf', 'A4', false);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/pdf/kardex_productos', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];

    let filtro = req.query.filtro;
    let producto = req.query.producto;
    let marca = req.query.marca;
    let fecha_ini = req.query.fecha_ini;
    let fecha_fin = req.query.fecha_fin;

    var productos = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM productos WHERE estado = 1");

    if(filtro != 'todos'){
        if(filtro == 'producto' && producto != 'todos'){
            productos = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM productos WHERE estado = 1 AND id = ?",[producto]);
        }
        if(filtro == 'marca' && marca != 'todos'){
            productos = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM productos WHERE estado = 1 AND marca_id = ?",[marca]);
        }
    }

    let html = ``;
    for(item of productos){
        html += `<table border="1">`;
        html += `<thead>`;
        html += `<tr>
                    <th colspan="9" class="centreado">${item.nombre}</th>
                </tr>`;
        html += `<tr>
                    <th rowspan="2" width="20px">FECHA</th>
                    <th rowspan="2">DETALLE</th>
                    <th colspan="3">CANTIDADES</th>
                    <th rowspan="2">P/U</th>
                    <th colspan="3">BOLIVIANOS</th>
                </tr>`;
                html += `<tr>
                            <th>ENTRADA</th>
                            <th>SALIDA</th>
                            <th>SALDO</th>
                            <th>ENTRADA</th>
                            <th>SALIDA</th>
                            <th>SALDO</th>
                        </tr>`;
        html += `</thead>`;
        html += `<tbody>`;

        const kardex_productos = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM kardex_productos WHERE producto_id = ? AND fecha BETWEEN ? AND ?",[item.id,fecha_ini,fecha_fin]);
        
        // verificar saldo anterior
        const saldo_anteriors = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM kardex_productos WHERE producto_id = ? AND fecha < ? ORDER BY id DESC",[item.id,fecha_ini]);
        const saldo_anterior = saldo_anteriors[0];
        if(saldo_anterior || kardex_productos.length > 0){
            if(saldo_anterior){
                const cantidad_saldo = saldo_anterior.cantidad_saldo;
                const monto_saldo = saldo_anterior.monto_saldo;
                html += `<tr>
                            <td></td>
                            <td>SALDO ANTERIOR</td>
                            <td></td>
                            <td></td>
                            <td class="centreado">${cantidad_saldo}</td>
                            <td class="centreado">${item.precio}</td>
                            <td></td>
                            <td></td>
                            <td class="centreado">${monto_saldo}</td>
                        </tr>`
            }

            for(kardex of kardex_productos){
                html += `<tr>
                            <td>${kardex.fecha}</td>
                            <td>${kardex.detalle}</td>
                            <td class="centreado">${kardex.cantidad_ingreso?kardex.cantidad_ingreso:''}</td>
                            <td class="centreado">${kardex.cantidad_salida?kardex.cantidad_salida:''}</td>
                            <td class="centreado">${kardex.cantidad_saldo}</td>
                            <td class="centreado">${kardex.cu}</td>
                            <td class="centreado">${kardex.monto_ingreso?kardex.monto_ingreso:''}</td>
                            <td class="centreado">${kardex.monto_salida?kardex.monto_salida:''}</td>
                            <td class="centreado">${kardex.monto_saldo}</td>
                        </tr>`
            }
        }else{
            html += `
                    <tr>
                        <td colspan="9" class="centreado">NO SE ENCONTRARON REGISTROS</td>
                    </tr>`
        }
        html += `</tbody>`;
        html += `</table>`;
    }

    let datos = {};
    datos.html = html;
    datos.configuracion = configuracion;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();

    let url_file = await generaPDF('kardex_productos', datos, 'kardexProductos.pdf', 'A4', false);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
});

router.get('/pdf/ventas', async (req, res) => {
    pagina = {};
    pagina.actual = 'reportes';
    var hostname = req.headers.host; // hostname = 'localhost'
    const urlbase = 'http://' + hostname;
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];

    let filtro = req.query.filtro;
    let producto = req.query.producto;
    let marca = req.query.marca;
    let fecha_ini = req.query.fecha_ini;
    let fecha_fin = req.query.fecha_fin;


    var ventas = await pool.query("SELECT *, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM ventas WHERE estado = 1 AND fecha_registro BETWEEN ? AND ?",[fecha_ini,fecha_fin]);
    if(filtro !='todos'){
        if(filtro == 'producto' && producto != 'todos'){
            ventas = await pool.query("SELECT v.*, DATE_FORMAT(v.fecha_registro, '%Y-%m-%d') as fecha_registro FROM ventas v INNER JOIN detalle_ventas dv ON dv.venta_id = v.id WHERE v.estado = 1 AND dv.producto_id = ? AND v.fecha_registro BETWEEN ? AND ?",[producto, fecha_ini, fecha_fin]);
        }

        if(filtro == 'marca' && marca != 'todos'){
            ventas = await pool.query("SELECT v.*, DATE_FORMAT(v.fecha_registro, '%Y-%m-%d') as fecha_registro FROM ventas v INNER JOIN detalle_ventas dv ON dv.venta_id = v.id INNER JOIN productos p ON p.id = dv.producto_id WHERE v.estado = 1 AND p.marca_id = ? AND v.fecha_registro BETWEEN ? AND ?",[marca, fecha_ini, fecha_fin]);
        }
    }

    let html = ``;
    for(item of ventas){
        const users = await pool.query("SELECT usuario FROM users WHERE id = ?",[item.cliente_id])
        const user = users[0];
        const clientes = await pool.query("SELECT nombre FROM clientes WHERE id = ?",[item.cliente_id])
        const cliente = clientes[0];
        html += `<table border="1">`;
        html += `<thead>
                    <tr>
                        <th style="text-align:left;" width="15%">Fecha y hora:</th>
                        <th style="text-align:left;" colspan="3">${item.fecha_registro} ${item.hora}</th>
                    </tr>
                    <tr>
                        <th style="text-align:left;">Cliente:</th>
                        <th style="text-align:left;" colspan="3">${cliente.nombre}</th>
                    </tr>
                    <tr>
                        <th style="text-align:left;">Nit:</th>
                        <th style="text-align:left;" colspan="3">${item.nit}</th>
                    </tr>
                    <tr>
                        <th style="text-align:left;">
                            Usuario:
                        </th>
                        <th style="text-align:left;" colspan="3">${user.usuario}</th>
                    </tr>
                    <tr>
                        <th colspan="4">DETALLE DE ORDEN</th>
                    </tr>
                </thead>`;
        html += `<tbody>
                    <tr>
                        <td class="bold centreado">Producto</td>
                        <td class="bold centreado">Cantidad</td>
                        <td class="bold centreado">P/U</td>
                        <td class="bold centreado">Subtotal</td>
                    </tr>`;
        
        const detalle_ventas = await pool.query("SELECT dv.*, p.nombre FROM detalle_ventas dv INNER JOIN productos p ON p.id = dv.producto_id WHERE venta_id = ?",[item.id]);

        for (dv of detalle_ventas){
            html += `<tr>
                        <td>${dv.nombre }</td>
                        <td class="centreado">${dv.cantidad}</td>
                        <td class="centreado">${dv.precio}</td>
                        <td class="centreado">${dv.subtotal}</td>
                    </tr>`;
        }
        html += `
                <tr>
                    <td style="text-align:right; font-weight:bold;" colspan="3">TOTAL</td>
                    <td style="font-weight:bold;text-align:center;">${item.total}</td>
                </tr>
                <tr>
                    <td style="text-align:right; font-weight:bold;" colspan="3">DESCUENTO</td>
                    <td style="font-weight:bold;text-align:center;">${item.descuento}%</td>
                </tr>
                <tr>
                    <td style="text-align:right; font-weight:bold;" colspan="3">TOTAL FINAL</td>
                    <td style="font-weight:bold;text-align:center;">${item.total_final}</td>
                </tr>
            </tbody>
        </table>`;
    }

    let datos = {};
    datos.html = html;
    datos.configuracion = configuracion;
    datos.urlbase = urlbase;
    datos.fecha = fechaActual();

    let url_file = await generaPDF('kardex_productos', datos, 'Ventas.pdf', 'A4', false);

    fs.readFile(url_file, function (err, data) {
        res.contentType("application/pdf");
        res.send(data);
    });
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