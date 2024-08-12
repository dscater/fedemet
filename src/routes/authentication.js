const { response } = require('express');
const express = require('express');
const pool = require('../database');
const router = express.Router();
const passport = require('passport');
const { isNotLoggedIn } = require('../lib/auth');

router.get('/login',isNotLoggedIn,async (request, response) => {
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];
    response.render('auth/login',{layout:'login',razon_social:razon_social});
});

router.post('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

router.post('/login', async (req, res, next) => {
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];
    global.razon_social = razon_social;
    passport.authenticate('local.login', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    })(req, res, next);
});

module.exports = router;