const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'tratamientos_pacientes';

    var pacientes = [];
    if (req.user.tipo == 'DOCTOR') {
        var especialidad = null;
        var datosUsuario = null;
        var doctor = null;
        var datos_usuarios = [];
        var _doctors = null;
        var _especialidads = null;
        datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?", [req.user.id]);
        if (datos_usuarios.length > 0) {
            datosUsuario = datos_usuarios[0];
        }
        if (datosUsuario) {
            _doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?", [datosUsuario.id]);
            if (_doctors.length > 0) {
                doctor = _doctors[0];
                if (doctor) {
                    _especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctor.especialidad_id]);
                    especialidad = _especialidads[0];
                }
            }
        }
        pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    res.render('tratamientos_pacientes/index', { pacientes, pagina });
});
router.get('/get/tratamientos', async (req, res) => {
    const paciente_id = req.query.paciente_id;

    const especialidades_paciente = await pool.query("SELECT *, e.nombre as especialidad FROM paciente_especialidads pe JOIN especialidads e ON pe.especialidad_id = e.id WHERE paciente_id = ?", [paciente_id]);

    let html = ``;
    for(let i = 0; i<especialidades_paciente.length; i++){
        html +=`<div class="card">
        <div class="card-header bg-gray">
            <h3>${especialidades_paciente[i].especialidad}</h3>
        </div>
        <div class="card-body">`;
        const seguimientos = await pool.query('SELECT *, date_format(fecha_registro,"%d/%m/%Y") as fecha_registro FROM seguimientos WHERE paciente_id = ? AND especialidad_id = ?', [paciente_id,especialidades_paciente[i].especialidad_id]);

        if(seguimientos.length > 0){
            for(let j=0; j < seguimientos.length; j++){
                html +=` <table class="table table-bordered">
                        <tbody>
                            <tr>
                                <td width="20px" class="bg-gray">DIAGNOSTICO</td>
                                <td>${seguimientos[j].diagnostico}</td>
                                <td width="20px" class="bg-gray">DETALLE</td>
                                <td>${seguimientos[j].detalle}</td>
                                <td width="20px" class="bg-gray">FECHA</td>
                                <td width="40px">${seguimientos[j].fecha_registro}</td>
                            </tr>
                        </tbody>
                    </table>
                    <h4 class="text-center text-gray mt-4">LISTA DE TRATAMIENTOS</h4>
                    <table class="table">
                        <thead>
                            <tr>
                                <th class="text-gray">SUBJETIVO</th>
                                <th class="text-gray">OBJETIVO</th>
                                <th class="text-gray">TRATAMIENTO</th>
                                <th class="text-gray">DIAGNOSTICO</th>
                                <th class="text-gray">FECHA</th>
                            </tr>
                        </thead>
                        <tbody>`;
                const tratamientos = await pool.query('SELECT *, date_format(fecha,"%d/%m/%Y") as fecha FROM tratamientos WHERE seguimiento_id = ?', [seguimientos[j].id]);
                for(let k=0; k<tratamientos.length; k++){
                    html +=`<tr>
                                <td>${tratamientos[k].subjetivo}</td>
                                <td>${tratamientos[k].objetivo}</td>
                                <td>${tratamientos[k].tratamiento}</td>
                                <td>${tratamientos[k].diagnostico}</td>
                                <td>${tratamientos[k].fecha} ${tratamientos[k].hora}</td>
                            </tr>`;
                }
                html +=`</tbody>
                </table>`;
                html += `<hr style="border-top:dotted 4px green;">`;
            }
        }else{
            html += `<tr><td>NO SE ENCONTRARÓN REGISTROS</td></tr></tbody>
            </table></div>
            </div>
            <hr>`;
        }
        html +=`</div>
            </div>`;
    }
    res.json({
        sw:true,
        res:200,
        html:html
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

function horaActual()
{
    let date = new Date()
    let hora = date.getHours();
    let minuto = date.getMinutes();
    let segundo = date.getSeconds();

    let hora_actual = `${hora}:${minuto}:${segundo}`;
    return hora_actual;
}

module.exports = router;