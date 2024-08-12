const express = require('express');
const pool = require('../database');
const router = express.Router();
const { isNotLoggedIn } = require('../lib/auth');

router.get('/',isNotLoggedIn,async (request, response) => {
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];
    response.render('auth/login',{layout:'login',razon_social:razon_social});
});

module.exports = router;