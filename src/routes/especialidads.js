const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';
    const especialidads = await pool.query("SELECT e.*, COUNT(eh.id) AS nro_horarios FROM especialidads e LEFT JOIN especialidad_horarios eh ON eh.especialidad_id = e.id WHERE estado = 1 GROUP BY e.id");
    res.render('especialidads/index', { especialidads: especialidads, pagina });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';

    res.render('especialidads/create', { pagina: pagina });
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'especialidads';
    let nuevo = {
        nombre:req.body.nombre.toUpperCase(),
        descripcion:req.body.descripcion.toUpperCase(),
        estado:1
    }; 

    let result = await pool.query("INSERT INTO especialidads SET ?",[nuevo]);
    let nuevo_registro = result.insertId;
    req.flash('success','Registro éxitoso')
    return res.redirect('/especialidads');
});

router.get('/edit/:id', async(req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';
    const {id} = req.params;
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[id]);
    const especialidad = especialidads[0];
    res.render('especialidads/edit', { pagina: pagina, especialidad:especialidad });
});

router.get('/show/:id', async(req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';
    const {id} = req.params;
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[id]);
    const especialidad = especialidads[0];
    res.render('especialidads/show', { pagina: pagina, especialidad:especialidad });
});


router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'especialidads';
    const {id} = req.params;
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[id]);
    const especialidad = especialidads[0];

    let registro_update = {};
    registro_update.nombre = req.body.nombre.toUpperCase();
    registro_update.descripcion = req.body.descripcion.toUpperCase();

    let nr_user = await pool.query("UPDATE especialidads SET ? WHERE id = ?",[registro_update,especialidad.id]);
    req.flash('success','Registro modificado con éxito')
    return res.redirect('/especialidads');
   
});

router.post('/destroy/:id',async (req, res, next) => {
    // const {id} = req.params;
    // const result = await pool.query("UPDATE especialidads SET estado = 0 WHERE id = ?",[id]);
    // req.flash('success','Registro eliminado con éxito')
    // return res.redirect('/especialidads');
});

module.exports = router;