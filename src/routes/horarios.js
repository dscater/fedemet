const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';

    const {id} = req.params;
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[id]);
    const especialidad = especialidads[0];

    const horarios = await pool.query("SELECT * FROM especialidad_horarios WHERE especialidad_id = ?",[especialidad.id]);
    res.render('horarios/index', { horarios, pagina, especialidad });
});

router.get('/create/:id', async(req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';

    const {id} = req.params;
    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[id]);
    const especialidad = especialidads[0];

    let horas = array_horas();

    res.render('horarios/create', { pagina: pagina, especialidad , horas:horas});
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'especialidads';
    let nuevo = {
        especialidad_id:req.body.especialidad_id,
        hora:req.body.hora,
    }; 

    let result = await pool.query("INSERT INTO especialidad_horarios SET ?",[nuevo]);
    let nuevo_registro = result.insertId;
    req.flash('success','Registro éxitoso')
    return res.redirect('/horarios/'+req.body.especialidad_id);
});

router.get('/edit/:id', async(req, res) => {
    pagina = {};
    pagina.actual = 'especialidads';
    const {id} = req.params;
    const horarios = await pool.query("SELECT * FROM especialidad_horarios WHERE id = ?",[id]);
    const horario = horarios[0];

    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[horario.especialidad_id]);
    const especialidad = especialidads[0];
    let horas = array_horas();

    horario.hora = horario.hora.substring(0,5);
    res.render('horarios/edit', { pagina: pagina, horario, especialidad, horas });
});

router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'especialidads';
    const {id} = req.params;
    const horarios = await pool.query("SELECT * FROM especialidad_horarios WHERE id = ?",[id]);
    const horario = horarios[0];

    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[horario.especialidad_id]);
    const especialidad = especialidads[0];

    let registro_update = {};
    registro_update.hora = req.body.hora;

    let nr_user = await pool.query("UPDATE especialidad_horarios SET ? WHERE id = ?",[registro_update,horario.id]);
    req.flash('success','Registro modificado con éxito')
    return res.redirect('/horarios/'+especialidad.id);
   
});

router.post('/destroy/:id',async (req, res, next) => {
    const {id} = req.params;
    const horarios = await pool.query("SELECT * FROM especialidad_horarios WHERE id = ?",[id]);
    const horario = horarios[0];

    const especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[horario.especialidad_id]);
    const especialidad = especialidads[0];
    const result = await pool.query("DELETE FROM especialidad_horarios WHERE id = ?",[id]);
    req.flash('success','Registro eliminado con éxito')
    return res.redirect('/horarios/'+especialidad.id);
});


function array_horas()
{
    let array_horas = [];
    let horas = 0;
    let minutos = 0;
    let hora_select = '';
    for(let i = 1; i <= 48; i++)
    {
        hora_select = '';
    
        if(horas < 10)
        {
            hora_select += '0'+horas;
        }
        else{
            hora_select += horas;
        }
    
        if(minutos == 0)
        {
            hora_select += ':00';
        }
        else{
            hora_select += ':30';
        }
        
        array_horas.push(hora_select);
        if(minutos == 30)
        {
            minutos = 0;
            horas++;
        }
        else{
            minutos = 30;
        }
    }
    return array_horas;
}

module.exports = router;