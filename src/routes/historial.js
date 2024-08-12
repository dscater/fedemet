const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {});

router.get('/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'historial_clinico';
    const {
        id
    } = req.params;
    let paciente_id = id;
    let especialidad_id = 'todos';

    let pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '%Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1");

    if (paciente_id != 'todos') {
        pacientes = await pool.query("SELECT p.*, u.foto, DATE_FORMAT(fecha_nac, '&Y-%m-%d') as fecha_nac, DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND p.id = ?", [paciente_id]);
    }

    // RELLENAR SUS ESPECIALIDADES
    for (let i = 0; i < pacientes.length; i++) {
        let consultas = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM consultas WHERE paciente_id = ?", [pacientes[i].id]);
        pacientes[i].consultas = consultas;

        if (especialidad_id != 'todos') {
            consultas = await pool.query("SELECT *,DATE_FORMAT(fecha_registro, '%Y-%m-%d') as fecha_registro FROM consultas WHERE paciente_id = ? AND especialidad_id = ?", [pacientes[i].id, especialidad_id]);
        }

        for (let j = 0; j < pacientes[i].consultas.length; j++) {

            let especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [pacientes[i].consultas[j].especialidad_id]);
            let especialidad = especialidads[0];
            pacientes[i].consultas[j].especialidad = especialidad;

            let hpPersonals = await pool.query("SELECT * FROM historia_patologica_personals WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let hpPersonal = hpPersonals[0];
            pacientes[i].consultas[j].hpPersonal = hpPersonal;

            let hnpPersonals = await pool.query("SELECT * FROM historia_no_patologica_personals WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let hnpPersonal = hnpPersonals[0];
            pacientes[i].consultas[j].hnpPersonal = hnpPersonal;

            let hpfPersonals = await pool.query("SELECT * FROM historia_patologica_familiars WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let hpfPersonal = hpfPersonals[0];
            pacientes[i].consultas[j].hpfPersonal = hpfPersonal;

            let examen_fisicos = await pool.query("SELECT * FROM examen_fisico WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let examen_fisico = examen_fisicos[0];
            pacientes[i].consultas[j].examen_fisico = examen_fisico;

            let obstreticos = await pool.query("SELECT *, DATE_FORMAT(fin_eAnterior, '%Y-%m-%d') as fin_eAnterior FROM obstreticos WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let obstretico = obstreticos[0];
            pacientes[i].consultas[j].obstretico = obstretico;

            let gestacion_actuals = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM gestacion_actual WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let gestacion_actual = gestacion_actuals[0];
            pacientes[i].consultas[j].gestacion_actual = gestacion_actual;

            let morbilidads = await pool.query("SELECT * FROM morbilidad WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let morbilidad = morbilidads[0];
            pacientes[i].consultas[j].morbilidad = morbilidad;

            let odontologicos = await pool.query("SELECT * FROM odontologico WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let odontologico = odontologicos[0];
            pacientes[i].consultas[j].odontologico = odontologico;

            let laboratorios = await pool.query("SELECT * FROM laboratorios WHERE consulta_id = ?", [pacientes[i].consultas[j].id]);
            let laboratorio = laboratorios[0];
            pacientes[i].consultas[j].laboratorio = laboratorio;
        }
    }

    let datos = {};
    datos.pacientes = pacientes;

    res.render('historial/historial', {
        pagina: pagina,
        datos: datos,
    });
});

module.exports = router;