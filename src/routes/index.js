const express = require('express');
const pool = require('../database');
const router = express.Router();
const { isNotLoggedIn } = require('../lib/auth');

router.get('/',isNotLoggedIn,async (request, response) => {
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];
    response.render('auth/login',{layout:'login',configuracion:configuracion});
});

module.exports = router;