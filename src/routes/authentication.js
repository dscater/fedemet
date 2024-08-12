const { response } = require('express');
const express = require('express');
const pool = require('../database');
const router = express.Router();
const passport = require('passport');
const { isNotLoggedIn } = require('../lib/auth');

router.get('/login',isNotLoggedIn,async (request, response) => {
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];
    response.render('auth/login',{layout:'login',configuracion:configuracion});
});

router.post('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

router.post('/login', async (req, res, next) => {
    const configuracions = await pool.query("SELECT * FROM configuracions");
    const configuracion = configuracions[0];
    global.configuracion = configuracion;
    passport.authenticate('local.login', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    })(req, res, next);
});

module.exports = router;