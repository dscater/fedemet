const express = require('express');
const {
    isLoggedIn
} = require('../lib/auth');
const router = express.Router();

const pool = require('../database');

router.get('/', isLoggedIn, async (req, res) => {
    pagina = {};
    pagina.actual = 'home'

    // VALORES
    let usuarios = await pool.query("SELECT COUNT(*) as cantidad FROM users WHERE tipo IN ('ADMINISTRADOR','AUXILIAR') AND estado = 1");
    usuarios = usuarios[0].cantidad;

    let doctors = await pool.query("SELECT COUNT(*) as cantidad FROM users WHERE tipo IN ('DOCTOR') AND estado = 1");
    doctors = doctors[0].cantidad;

    let especialidads = await pool.query("SELECT COUNT(*) as cantidad FROM especialidads WHERE estado = 1");
    especialidads = especialidads[0].cantidad;

    let tipo_usuario = req.user.tipo;

    let pacientes = await pool.query("SELECT COUNT(*) as cantidad FROM users WHERE tipo IN('PACIENTE') AND estado = 1");

    let citas = 0;
    let citas_proximas = [];

    if (tipo_usuario == 'DOCTOR') {

        var especialidad = null;
        var datosUsuario = null;
        var doctor = null;
        var datos_usuarios = [];
        var _doctors = null;
        var _especialidads = null;
        // VERIFICAR SI EL USUARIO ESTA RELACIONADO CON "datos_usuarios" o pacientes
        nombreUsuario = req.user.name;
        datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?", [req.user.id]);
        if (datos_usuarios.length > 0) {
            datosUsuario = datos_usuarios[0];
        }
        if (datosUsuario) {
            nombreUsuario = `${datosUsuario.nombre} ${datosUsuario.paterno} ${datosUsuario.materno}`;

            _doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?", [datosUsuario.id]);
            if (_doctors.length > 0) {
                doctor = _doctors[0];
                if (doctor) {
                    _especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctor.especialidad_id]);
                    especialidad = _especialidads[0];
                }
            }
        }

        pacientes = await pool.query("SELECT COUNT(*) as cantidad FROM users u JOIN pacientes p ON p.user_id = u.id JOIN paciente_especialidads pe ON pe.paciente_id = p.id WHERE u.tipo IN('PACIENTE') AND u.estado = 1 AND pe.especialidad_id = ?", [especialidad.id]);
        citas = await pool.query("SELECT COUNT(*) as cantidad FROM cita_medicas WHERE especialidad_id = ?", [especialidad.id]);
        citas = citas[0].cantidad;

        citas_proximas = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM cita_medicas WHERE especialidad_id = ? AND fecha >= ? AND estado = 'PENDIENTE' ORDER BY fecha DESC , hora DESC", [especialidad.id, fechaActual()]);

        for (let i = 0; i < citas_proximas.length; i++) {
            let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [citas_proximas[i].paciente_id]);
            citas_proximas[i].paciente = pacientes[0];
        }

    }

    consultas = 0;
    lista_citas = null;
    if (tipo_usuario == 'PACIENTE') {

        let pacientes = null;
        let paciente = null;
        pacientes = await pool.query("SELECT * FROM pacientes WHERE user_id = ?", [req.user.id]);
        paciente = null;
        if (pacientes.length > 0) {
            paciente = pacientes[0];
        }
        citas = await pool.query("SELECT COUNT(*) as cantidad FROM cita_medicas WHERE paciente_id = ?", [paciente.id]);
        citas = citas[0].cantidad;

        consultas = await pool.query("SELECT COUNT(*) as cantidad FROM consultas WHERE paciente_id = ?", [paciente.id]);
        consultas = consultas[0].cantidad;

        citas_proximas = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha FROM cita_medicas WHERE paciente_id = ? AND fecha >= ? AND estado = 'PENDIENTE' ORDER BY fecha DESC , hora DESC", [paciente.id, fechaActual()]);

        for (let i = 0; i < citas_proximas.length; i++) {
            let _pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [citas_proximas[i].paciente_id]);
            let _paciente = _pacientes[0];
            citas_proximas[i].paciente = _paciente;
        }
    }

    pacientes = pacientes[0].cantidad;

    let notifica = false;
    let muestra_notificacion = false;
    if (tipo_usuario == 'ADMINISTRADOR' || tipo_usuario == 'AUXILIAR') {
        notifica = true;
        // PRODUCTOS STOCK BAJO
        const stock_bajos = await pool.query("SELECT count(*) as cantidad FROM productos WHERE stock_actual <= cantidad_alerta;");
        let cantidad_bajos = stock_bajos[0].cantidad;
        if(cantidad_bajos > 0){
            muestra_notificacion=true;
        }
    }

    res.render('home', {
        pagina,
        usuarios: usuarios,
        doctors: doctors,
        especialidads: especialidads,
        pacientes: pacientes,
        citas: citas,
        citas_proximas: citas_proximas,
        consultas: consultas,
        notifica: notifica,
        notifica:notifica,
        muestra_notificacion:muestra_notificacion,
    });
});
module.exports = router;

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