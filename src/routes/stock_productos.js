const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'stock_productos'

    const productos = await pool.query('SELECT * FROM productos;');
    res.render('stock_productos/index', {
        productos: productos,
        pagina
    });
});

module.exports = router;