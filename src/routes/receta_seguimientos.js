const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    const { id } = req.params;
    const seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [id]);
    const seguimiento = seguimientos[0];
    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [seguimiento.paciente_id]);
    let paciente = pacientes[0];
    seguimiento.paciente = paciente;

    let users = await pool.query("SELECT * FROM users WHERE id = ?", [seguimiento.paciente.user_id]);
    let user = users[0];
    seguimiento.paciente.user = user;

    const receta_seguimientos = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM receta_seguimientos WHERE seguimiento_id = ?", [seguimiento.id]);


    for (let i = 0; i < receta_seguimientos.length; i++) {
        receta_seguimientos[i].recetas = {};
        const recetas = await pool.query("SELECT p.nombre FROM recetas r JOIN productos p ON r.producto_id = p.id WHERE r.rs_id = ?", [receta_seguimientos[i].id]);
        console.log(recetas);
        receta_seguimientos[i].recetas = recetas;
    }

    res.render('receta_seguimientos/index', { receta_seguimientos: receta_seguimientos, seguimiento, pagina });
});

router.get('/create/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    const { id } = req.params;
    const seguimientos = await pool.query("SELECT * FROM seguimientos WHERE id = ?", [id]);
    const seguimiento = seguimientos[0];

    let fecha = fechaActual();
    let hora = horaActual();

    // OBTENER PRODUCTOS
    const productos = await pool.query('SELECT id, nombre FROM productos;');
    res.render('receta_seguimientos/create', { pagina: pagina, seguimiento, fecha: fecha, hora: hora, productos });
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'seguimientos';

    console.log(req.body);

    let a_productos = req.body.productos;
    let a_cantidad = req.body.cantidad;

    const nuev_rs = {
        seguimiento_id: req.body.seguimiento_id,
        paciente: req.body.paciente.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        fecha: req.body.fecha
    };

    let result = await pool.query("INSERT INTO receta_seguimientos SET ?", [nuev_rs]);
    let id_rs = result.insertId;

    let tipo_recetas = req.body.tipo_recetas;

    // REGISTRAR LISTADO RECETAS
    for (let i = 0; i < a_productos.length; i++) {
        const nueva_receta = {
            rs_id: id_rs,
            producto_id: a_productos[i],
            cantidad: a_cantidad[i],
            tipo: tipo_recetas[i]
        }
        console.log(nueva_receta);

        await pool.query("INSERT INTO recetas SET ?", [nueva_receta]);

        if (tipo_recetas[i] == 'INTERNA') {
            // ACTUALIZA STOCK
            const productos = await pool.query("SELECT id, stock_actual FROM productos WHERE id = ?", [nueva_receta.producto_id]);
            const producto = productos[0];
            let stock_actual = producto.stock_actual;
            stock_actual -= parseFloat(nueva_receta.cantidad);
            await pool.query("UPDATE productos SET stock_actual = ? WHERE id = ?", [stock_actual, producto.id]);
        }
    }

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/receta_seguimientos/' + nuev_rs.seguimiento_id);
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'seguimientos';
    const { id } = req.params;
    // OBTENER EL REGISTRO POR SU ID
    const receta_seguimientos = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM receta_seguimientos WHERE id = ?", [id]);
    const receta_seguimiento = receta_seguimientos[0];

    // OBTENER LAS RECETAS DEL SEGUIMIENTO-RECETAS
    let recetas = await pool.query("SELECT r.*,p.id as producto_id, p.nombre as producto FROM recetas r JOIN productos p ON r.producto_id = p.id WHERE rs_id = ?", [receta_seguimiento.id]);

    // OBTENER PRODUCTOS
    const productos = await pool.query('SELECT id, nombre FROM productos;');

    res.render('receta_seguimientos/edit', { pagina, receta_seguimiento, recetas, productos });
});

router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'seguimientos';
    const { id } = req.params;
    const receta_seguimientos = await pool.query("SELECT * FROM receta_seguimientos WHERE id = ?", [id]);
    const receta_seguimiento = receta_seguimientos[0];

    let a_productos = req.body.productos;
    let a_cantidad = req.body.cantidad;

    const registro_update = {
        paciente: req.body.paciente.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        fecha: req.body.fecha
    };

    await pool.query("UPDATE receta_seguimientos SET ? WHERE id = ?", [registro_update, receta_seguimiento.id]);

    let tipo_recetas = req.body.tipo_recetas;
    // REGISTRAR LISTADO RECETAS
    let id_rs = receta_seguimiento.id;
    if (req.body.productos) {
        for (let i = 0; i < a_productos.length; i++) {
            const nueva_receta = {
                rs_id: id_rs,
                producto_id: a_productos[i],
                cantidad: a_cantidad[i],
                tipo: tipo_recetas[i]
            }

            await pool.query("INSERT INTO recetas SET ?", [nueva_receta]);

            if (tipo_recetas[i] == 'INTERNA') {
                // ACTUALIZA STOCK
                const productos = await pool.query("SELECT id, stock_actual FROM productos WHERE id = ?", [nueva_receta.producto_id]);
                const producto = productos[0];
                let stock_actual = producto.stock_actual;
                stock_actual -= parseFloat(nueva_receta.cantidad);
                await pool.query("UPDATE productos SET stock_actual = ? WHERE id = ?", [stock_actual, producto.id]);
            }

        }
    }

    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/receta_seguimientos/' + receta_seguimiento.seguimiento_id);

});

router.post('/destroy/:id', async (req, res, next) => {
    const { id } = req.params;
    let seguimiento_id = 0;
    const receta_seguimientos = await pool.query("SELECT * FROM receta_seguimientos WHERE id = ?", [id]);
    seguimiento_id = receta_seguimientos[0].seguimiento_id;
    const recetas = await pool.query("SELECT * FROM recetas WHERE rs_id = ?", [id]);

    for (let i = 0; i < recetas.length; i++) {
        // ACTUALIZA STOCK
        const productos = await pool.query("SELECT id, stock_actual FROM productos WHERE id = ?", [recetas[i].producto_id]);
        const producto = productos[0];
        let stock_actual = producto.stock_actual;
        stock_actual += parseFloat(recetas[i].cantidad);
        await pool.query("UPDATE productos SET stock_actual = ? WHERE id = ?", [stock_actual, producto.id]);
    }

    const result = await pool.query("DELETE FROM receta_seguimientos WHERE id = ?", [id]);

    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/receta_seguimientos/' + seguimiento_id);
});

router.post('/elimina/receta/:id', async (req, res, next) => {
    const { id } = req.params;
    let seguimiento_id = 0;
    const recetas = await pool.query("SELECT * FROM recetas WHERE id = ?", [id]);
    const receta = recetas[0];

    if (receta.tipo == 'INTERNA') {
        // ACTUALIZA STOCK
        const productos = await pool.query("SELECT id, stock_actual FROM productos WHERE id = ?", [receta.producto_id]);
        const producto = productos[0];
        let stock_actual = producto.stock_actual;
        stock_actual += parseFloat(receta.cantidad);
        await pool.query("UPDATE productos SET stock_actual = ? WHERE id = ?", [stock_actual, producto.id]);
    }
    const result = await pool.query("DELETE FROM recetas WHERE id = ?", [id]);
    res.json({
        sw: true
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

function horaActual() {
    let date = new Date()
    let hora = date.getHours();
    let minuto = date.getMinutes();
    let segundo = date.getSeconds();

    let hora_actual = `${hora}:${minuto}:${segundo}`;
    return hora_actual;
}

module.exports = router;