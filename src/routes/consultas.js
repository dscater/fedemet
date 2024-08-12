const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'consultas';

    var especialidad = null;
    if (req.user.tipo == 'DOCTOR') {
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
    }

    const consultas = await pool.query("SELECT c.*, DATE_FORMAT(c.fecha_registro, '%Y-%m-%d') as fecha_registro FROM consultas c WHERE c.estado = 1 AND c.especialidad_id = ?", [especialidad.id]);

    for (let i = 0; i < consultas.length; i++) {
        let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [consultas[i].paciente_id]);
        let paciente = pacientes[0];
        consultas[i].paciente = paciente;
    }

    res.render('consultas/index', {
        consultas: consultas,
        pagina
    });
});

router.get('/obtieneFormluario', async (req, res) => {
    paciente = await pool.query("SELECT * FROM pacientes WHERE id=?", [req.query.paciente_id]);
    let dir = 'femenino';
    if (paciente[0].genero_id == 1) {
        // masculino
        dir = 'masculino';
    }
    let nom_especialidad = req.query.nom_especialidad;
    switch (nom_especialidad) {
        case 'PEDIATRÍA':
            res.render('partials/consultas/' + dir + '/pediatria', {
                layout: 'vacio',
                paciente
            });
            break;
        case 'GINECOLOGÍA':
            res.render('partials/consultas/' + dir + '/ginecologia', {
                layout: 'vacio',
                paciente
            });
            break;
        case 'CARDIOLOGÍA':
            res.render('partials/consultas/' + dir + '/cardiologia', {
                layout: 'vacio',
                paciente
            });
            break;
        case 'ECOGRAFÍA':
            res.render('partials/consultas/' + dir + '/ecografia', {
                layout: 'vacio',
                paciente
            });
            break;
        case 'ODONTOLOGÍA':
            res.render('partials/consultas/' + dir + '/odontologia', {
                layout: 'vacio',
                paciente
            });
            break;
        case 'LABORATORIOS':
            res.render('partials/consultas/' + dir + '/laboratorios', {
                layout: 'vacio',
                paciente
            });
            break;
    }
});

router.get('/create', async (req, res) => {
    pagina = {};
    pagina.actual = 'consultas';
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

    res.render('consultas/create', {
        pagina: pagina,
        pacientes,
        especialidad_id: especialidad.id,
        nom_especialidad: especialidad.nombre
    });
});

router.post('/store', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'consultas';

    let info_paciente = await pool.query("SELECT * FROM pacientes WHERE id = ?", [req.body.paciente_id]);
    info_paciente = info_paciente[0];

    var especialidad = null;
    if (req.user.tipo == 'DOCTOR') {
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
    }

    let nueva_consulta = {
        especialidad_id: especialidad.id,
        paciente_id: req.body.paciente_id,
        motivo_consulta: req.body.motivo_consulta,
        descripcion_dolencia: req.body.descripcion_dolencia,
        fecha_registro: fechaActual(),
        estado: 1
    };

    let r_consulta = await pool.query("INSERT INTO consultas SET ?", [nueva_consulta]);
    let consulta_id = r_consulta.insertId;

    let nueva_hpPersonal = {
        consulta_id: consulta_id,
        hipertension: req.body.hipertension,
        tbc: req.body.tbc,
        diabetes: req.body.diabetes,
        mamaria: req.body.mamaria,
        cardiopatias: req.body.cardiopatias,
        its: req.body.its,
        varices: req.body.varices,
        renal: req.body.renal,
        hepatopatias: req.body.hepatopatias,
        t_genitales: req.body.t_genitales,
        gastrointestinal: req.body.gastrointestinal,
        chagas: req.body.chagas,
        otros: req.body.otros,
    }
    await pool.query("INSERT INTO historia_patologica_personals SET ?", [nueva_hpPersonal]);

    let nueva_hnpPersonal = {
        consulta_id: consulta_id,
        agua: req.body.agua,
        alcantarillado: req.body.alcantarillado,
        alcohol: req.body.alcohol,
        catarsis: req.body.catarsis,
        diuresis: req.body.diuresis,
        fuma: req.body.fuma,
        observacion_f: req.body.observacion_f,
        otros_np: req.body.otros_np,
    }
    await pool.query("INSERT INTO historia_no_patologica_personals SET ?", [nueva_hnpPersonal]);


    let nueva_hpfPersonal = {
        consulta_id: consulta_id,
        f_hipertension: req.body.f_hipertension,
        f_tbc: req.body.f_tbc,
        f_diabetes: req.body.f_diabetes,
        f_mamaria: req.body.f_mamaria,
        f_cardiopatias: req.body.f_cardiopatias,
        f_its: req.body.f_its,
        f_varices: req.body.f_varices,
        f_renal: req.body.f_renal,
        f_hepatopatias: req.body.f_hepatopatias,
        f_t_genitales: req.body.f_t_genitales,
        f_gastrointestinal: req.body.f_gastrointestinal,
        f_chagas: req.body.f_chagas,
        f_otros: req.body.f_otros,
    }
    await pool.query("INSERT INTO historia_patologica_familiars SET ?", [nueva_hpfPersonal]);


    // EXAMEN FISICO
    if (especialidad.nombre == 'PEDIATRÍA' || especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'CARDIOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        let nuevo_eFisico = {
            consulta_id: consulta_id,
            e_general: req.body.e_general,
            piel: req.body.piel,
            craneo: req.body.craneo,
            cuello: req.body.cuello,
            torax: req.body.torax,
            abdomen: req.body.abdomen,
            genitales: req.body.genitales,
            columna: req.body.columna,
            neurologico: req.body.neurologico,
            impresion: req.body.impresion,
            conducta: req.body.conducta,
        }
        await pool.query("INSERT INTO examen_fisico SET ?", [nuevo_eFisico]);
    }

    // EXAMEN OBSTRETICOS Y GESTASIÓN
    if (especialidad.nombre == 'PEDIATRÍA' || especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        if (info_paciente.genero_id == 2) {
            let nuevo_eObstretico = {
                consulta_id: consulta_id,
                previas: req.body.previas,
                abortos: req.body.abortos,
                vaginales: req.body.vaginales,
                vivos: req.body.vivos,
                viven: req.body.viven,
                gemelares: req.body.gemelares,
                partos: req.body.partos,
                cesareas: req.body.cesareas,
                muertos: req.body.muertos,
                fin_eAnterior: req.body.fin_eAnterior,
            }

            if (req.body.fin_eAnterior == '') {
                nuevo_eObstretico.fin_eAnterior = null;
            }

            await pool.query("INSERT INTO obstreticos SET ?", [nuevo_eObstretico]);

            let nuevo_eGestasion = {
                consulta_id: consulta_id,
                fecha: req.body.fecha,
                peso: req.body.peso,
                drogas: req.body.drogas,
                violencia: req.body.violencia,
                planeado: req.body.planeado,
                glucemia: req.body.glucemia,
                suplemento: req.body.suplemento,
            }
            if (req.body.fecha == '') {
                nuevo_eGestasion.fecha = null;
            }
            await pool.query("INSERT INTO gestacion_actual SET ?", [nuevo_eGestasion]);
        }
    }

    // EXAMEN MORBILIDAD
    if (especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        if (info_paciente.genero_id == 2) {
            let nuevo_eMorbilidad = {
                consulta_id: consulta_id,
                hemorragia: req.body.hemorragia,
                observacion_hemorragia: req.body.observacion_hemorragia,
                transtornos: req.body.transtornos,
                observacion_transtornos: req.body.observacion_transtornos,
                infecciones: req.body.infecciones,
                observacion_infecciones: req.body.observacion_infecciones,
                obstetricas: req.body.obstetricas,
                observacion_obstetricas: req.body.observacion_obstetricas,
                intervencion: req.body.intervencion,
                observacion_intervencion: req.body.observacion_intervencion,
            }
            await pool.query("INSERT INTO morbilidad SET ?", [nuevo_eMorbilidad]);
        }
    }

    // EXAMEN ODONTOLOGICO
    if (especialidad.nombre == 'ODONTOLOGÍA') {
        let nuevo_eOdontologico = {
            consulta_id: consulta_id,
            o_hemorragia: req.body.o_hemorragia,
            observacion_hemo: req.body.observacion_hemo,
            atm: req.body.atm,
            ganglios: req.body.ganglios,
            respirador: req.body.respirador,
            labios: req.body.labios,
            lengua: req.body.lengua,
            paladar: req.body.paladar,
            piso_boca: req.body.piso_boca,
            mucosa: req.body.mucosa,
            encias: req.body.encias,
            protesis: req.body.protesis,
            cepillo: req.body.cepillo,
            hilo: req.body.hilo,
            enjuague: req.body.enjuague,
            sangrado_encias: req.body.sangrado_encias,
            observaciones: req.body.observaciones,
        }
        await pool.query("INSERT INTO odontologico SET ?", [nuevo_eOdontologico]);
    }

    //   LABORATORIOS
    if (especialidad.nombre == 'LABORATORIOS') {
        let nuevo_laboratorios = {
            consulta_id: consulta_id,
            baciloscopia: req.body.baciloscopia,
            billirrubinas: req.body.billirrubinas,
            c_simple: req.body.c_simple,
            c_seriado: req.body.c_seriado,
            creatinina_orina: req.body.creatinina_orina,
            creatinina_serica: req.body.creatinina_serica,
            cultivo: req.body.cultivo,
            eg_orina: req.body.eg_orina,
            f_reumatoide: req.body.f_reumatoide,
            fosfata: req.body.fosfata,
            frotis: req.body.frotis,
            grupo_sanguineo: req.body.grupo_sanguineo,
            glicemia: req.body.glicemia,
            gota: req.body.gota,
            hemoglobina: req.body.hemoglobina,
            hemograma: req.body.hemograma,
            igg: req.body.igg,
            moco: req.body.moco,
            nitrogeno_usu: req.body.nitrogeno_usu,
            proteinac: req.body.proteinac,
            proteinuria: req.body.proteinuria,
            coombs: req.body.coombs,
            sifilis: req.body.sifilis,
            coagulacion: req.body.coagulacion,
            protrombia: req.body.protrombia,
            tincion: req.body.tincion,
            transaminasas: req.body.transaminasas,
            embarazo: req.body.embarazo,
            reactantes: req.body.reactantes,
            widal: req.body.widal,
            rpr: req.body.rpr,
            estudios: req.body.estudios,
            otros_estudios: req.body.otros_estudios,
        }
        await pool.query("INSERT INTO laboratorios SET ?", [nuevo_laboratorios]);
    }

    req.flash('success', 'Registro éxitoso');
    return res.json('Registro éxitoso');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'consultas';
    const {
        id
    } = req.params;
    const consultas = await pool.query("SELECT * FROM consultas WHERE id = ?", [id]);
    const consulta = consultas[0];

    // RELLENAR CON PACIENTE
    let pacientes = await pool.query("SELECT * FROM pacientes WHERE id = ?", [consulta.paciente_id]);
    let paciente = pacientes[0];
    consulta.paciente = paciente;

    // PATOLOGICO PERSONAL
    let hpPersonals = await pool.query("SELECT * FROM historia_patologica_personals WHERE consulta_id = ?", [consulta.id]);
    let hpPersonal = hpPersonals[0];
    consulta.hpPersonal = hpPersonal;

    // NO PATOLOGICO PERSONAL
    let hnpPersonals = await pool.query("SELECT * FROM historia_no_patologica_personals WHERE consulta_id = ?", [consulta.id]);
    let hnpPersonal = hnpPersonals[0];
    consulta.hnpPersonal = hnpPersonal;

    // FAMILIAR PATOLOGICO PERSONAL
    let hfpPersonals = await pool.query("SELECT * FROM historia_patologica_familiars WHERE consulta_id = ?", [consulta.id]);
    let hfpPersonal = hfpPersonals[0];
    consulta.hfpPersonal = hfpPersonal;

    // EXAMEN FISICO
    let examen_fisicos = await pool.query("SELECT * FROM examen_fisico WHERE consulta_id = ?", [consulta.id]);
    let examen_fisico = examen_fisicos[0];
    consulta.examen_fisico = examen_fisico;

    // EXAMEN OBSTRETICOS
    let obstreticos = await pool.query("SELECT *, DATE_FORMAT(fin_eAnterior, '%Y-%m-%d') as fin_eAnterior FROM obstreticos WHERE consulta_id = ?", [consulta.id]);
    let obstretico = obstreticos[0];
    consulta.obstretico = obstretico;

    // EXAMEN GESTACION
    let gestacions = await pool.query("SELECT *, DATE_FORMAT(fecha, '%Y-%m-%d') as fecha  FROM gestacion_actual WHERE consulta_id = ?", [consulta.id]);
    let gestacion = gestacions[0];
    consulta.gestacion = gestacion;

    // EXAMEN MORBILIDAD
    let morbilidads = await pool.query("SELECT * FROM morbilidad WHERE consulta_id = ?", [consulta.id]);
    let morbilidad = morbilidads[0];
    consulta.morbilidad = morbilidad;

    // EXAMEN ODONTOLOGICO
    let odontologicos = await pool.query("SELECT * FROM odontologico WHERE consulta_id = ?", [consulta.id]);
    let odontologico = odontologicos[0];
    consulta.odontologico = odontologico;

    // EXAMEN LABORATORIOS
    let laboratorios = await pool.query("SELECT * FROM laboratorios WHERE consulta_id = ?", [consulta.id]);
    let laboratorio = laboratorios[0];
    consulta.laboratorio = laboratorio;


    var _pacientes = [];
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
        _pacientes = await pool.query("SELECT p.*, u.foto, u.id as user_id FROM pacientes p JOIN users u ON u.id = p.user_id WHERE u.estado = 1 AND EXISTS (SELECT * FROM paciente_especialidads WHERE especialidad_id = ? AND paciente_id = p.id)", [especialidad.id]);
    }

    res.render('consultas/edit', {
        pagina: pagina,
        consulta: consulta,
        pacientes: _pacientes,
        especialidad_id: especialidad.id,
        nom_especialidad: especialidad.nombre,
        html : getFormularioEdit(consulta,consulta.paciente,especialidad)
    });
});

router.post('/update/:id', async (req, res, next) => {
    pagina = {};
    pagina.actual = 'consultas';
    const {
        id
    } = req.params;
    const consultas = await pool.query("SELECT * FROM consultas WHERE id = ?", [id]);
    const consulta = consultas[0];

    let info_paciente = await pool.query("SELECT * FROM pacientes WHERE id = ?", [req.body.paciente_id]);
    info_paciente = info_paciente[0];

    var especialidad = null;
    if (req.user.tipo == 'DOCTOR') {
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
    }

    let nueva_consulta = {
        paciente_id: req.body.paciente_id,
        motivo_consulta: req.body.motivo_consulta,
        descripcion_dolencia: req.body.descripcion_dolencia,
    };

    await pool.query("UPDATE consultas SET ? WHERE id = ?", [nueva_consulta, consulta.id]);

    let nueva_hpPersonal = {
        hipertension: req.body.hipertension,
        tbc: req.body.tbc,
        diabetes: req.body.diabetes,
        mamaria: req.body.mamaria,
        cardiopatias: req.body.cardiopatias,
        its: req.body.its,
        varices: req.body.varices,
        renal: req.body.renal,
        hepatopatias: req.body.hepatopatias,
        t_genitales: req.body.t_genitales,
        gastrointestinal: req.body.gastrointestinal,
        chagas: req.body.chagas,
        otros: req.body.otros,
    }
    await pool.query("UPDATE historia_patologica_personals SET ? WHERE consulta_id = ?", [nueva_hpPersonal, consulta.id]);

    let nueva_hnpPersonal = {
        agua: req.body.agua,
        alcantarillado: req.body.alcantarillado,
        alcohol: req.body.alcohol,
        catarsis: req.body.catarsis,
        diuresis: req.body.diuresis,
        fuma: req.body.fuma,
        observacion_f: req.body.observacion_f,
        otros_np: req.body.otros_np,
    }
    await pool.query("UPDATE historia_no_patologica_personals SET ? WHERE consulta_id = ?", [nueva_hnpPersonal, consulta.id]);


    let nueva_hpfPersonal = {
        f_hipertension: req.body.f_hipertension,
        f_tbc: req.body.f_tbc,
        f_diabetes: req.body.f_diabetes,
        f_mamaria: req.body.f_mamaria,
        f_cardiopatias: req.body.f_cardiopatias,
        f_its: req.body.f_its,
        f_varices: req.body.f_varices,
        f_renal: req.body.f_renal,
        f_hepatopatias: req.body.f_hepatopatias,
        f_t_genitales: req.body.f_t_genitales,
        f_gastrointestinal: req.body.f_gastrointestinal,
        f_chagas: req.body.f_chagas,
        f_otros: req.body.f_otros,
    }
    await pool.query("UPDATE historia_patologica_familiars SET ? WHERE consulta_id = ?", [nueva_hpfPersonal, consulta.id]);


    // EXAMEN FISICO
    if (especialidad.nombre == 'PEDIATRÍA' || especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'CARDIOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        let nuevo_eFisico = {
            e_general: req.body.e_general,
            piel: req.body.piel,
            craneo: req.body.craneo,
            cuello: req.body.cuello,
            torax: req.body.torax,
            abdomen: req.body.abdomen,
            genitales: req.body.genitales,
            columna: req.body.columna,
            neurologico: req.body.neurologico,
            impresion: req.body.impresion,
            conducta: req.body.conducta,
        }
        await pool.query("UPDATE examen_fisico SET ? WHERE consulta_id = ?", [nuevo_eFisico, consulta.id]);
    }

    // EXAMEN OBSTRETICOS Y GESTASIÓN
    if (especialidad.nombre == 'PEDIATRÍA' || especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        if (info_paciente.genero_id == 2) {
            let nuevo_eObstretico = {
                previas: req.body.previas,
                abortos: req.body.abortos,
                vaginales: req.body.vaginales,
                vivos: req.body.vivos,
                viven: req.body.viven,
                gemelares: req.body.gemelares,
                partos: req.body.partos,
                cesareas: req.body.cesareas,
                muertos: req.body.muertos,
                fin_eAnterior: req.body.fin_eAnterior,
            }

            if (req.body.fin_eAnterior == '') {
                nuevo_eObstretico.fin_eAnterior = null;
            }


            await pool.query("UPDATE obstreticos SET ? WHERE consulta_id = ?", [nuevo_eObstretico, consulta.id]);

            let nuevo_eGestasion = {
                fecha: req.body.fecha,
                peso: req.body.peso,
                drogas: req.body.drogas,
                violencia: req.body.violencia,
                planeado: req.body.planeado,
                glucemia: req.body.glucemia,
                suplemento: req.body.suplemento,
            }

            if (req.body.fecha == '') {
                nuevo_eGestasion.fecha = null;
            }

            await pool.query("UPDATE gestacion_actual SET ? WHERE consulta_id = ?", [nuevo_eGestasion, consulta.id]);
        }

    }

    // EXAMEN MORBILIDAD
    if (especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        if (info_paciente.genero_id == 2) {
            let nuevo_eMorbilidad = {
                hemorragia: req.body.hemorragia,
                observacion_hemorragia: req.body.observacion_hemorragia,
                transtornos: req.body.transtornos,
                observacion_transtornos: req.body.observacion_transtornos,
                infecciones: req.body.infecciones,
                observacion_infecciones: req.body.observacion_infecciones,
                obstetricas: req.body.obstetricas,
                observacion_obstetricas: req.body.observacion_obstetricas,
                intervencion: req.body.intervencion,
                observacion_intervencion: req.body.observacion_intervencion,
            }
            await pool.query("UPDATE morbilidad SET ? WHERE consulta_id = ?", [nuevo_eMorbilidad, consulta.id]);
        }
    }

    // EXAMEN ODONTOLOGICO
    if (especialidad.nombre == 'ODONTOLOGÍA') {
        let nuevo_eOdontologico = {
            o_hemorragia: req.body.o_hemorragia,
            observacion_hemo: req.body.observacion_hemo,
            atm: req.body.atm,
            ganglios: req.body.ganglios,
            respirador: req.body.respirador,
            labios: req.body.labios,
            lengua: req.body.lengua,
            paladar: req.body.paladar,
            piso_boca: req.body.piso_boca,
            mucosa: req.body.mucosa,
            encias: req.body.encias,
            protesis: req.body.protesis,
            cepillo: req.body.cepillo,
            hilo: req.body.hilo,
            enjuague: req.body.enjuague,
            sangrado_encias: req.body.sangrado_encias,
            observaciones: req.body.observaciones,
        }
        await pool.query("UPDATE odontologico SET ? WHERE consulta_id = ?", [nuevo_eOdontologico, consulta.id]);
    }

    //   LABORATORIOS
    if (especialidad.nombre == 'LABORATORIOS') {
        let nuevo_laboratorios = {
            baciloscopia: req.body.baciloscopia,
            billirrubinas: req.body.billirrubinas,
            c_simple: req.body.c_simple,
            c_seriado: req.body.c_seriado,
            creatinina_orina: req.body.creatinina_orina,
            creatinina_serica: req.body.creatinina_serica,
            cultivo: req.body.cultivo,
            eg_orina: req.body.eg_orina,
            f_reumatoide: req.body.f_reumatoide,
            fosfata: req.body.fosfata,
            frotis: req.body.frotis,
            grupo_sanguineo: req.body.grupo_sanguineo,
            glicemia: req.body.glicemia,
            gota: req.body.gota,
            hemoglobina: req.body.hemoglobina,
            hemograma: req.body.hemograma,
            igg: req.body.igg,
            moco: req.body.moco,
            nitrogeno_usu: req.body.nitrogeno_usu,
            proteinac: req.body.proteinac,
            proteinuria: req.body.proteinuria,
            coombs: req.body.coombs,
            sifilis: req.body.sifilis,
            coagulacion: req.body.coagulacion,
            protrombia: req.body.protrombia,
            tincion: req.body.tincion,
            transaminasas: req.body.transaminasas,
            embarazo: req.body.embarazo,
            reactantes: req.body.reactantes,
            widal: req.body.widal,
            rpr: req.body.rpr,
            estudios: req.body.estudios,
            otros_estudios: req.body.otros_estudios,
        }
        await pool.query("UPDATE laboratorios SET ? WHERE consulta_id = ?", [nuevo_laboratorios, consulta.id]);
    }
    req.flash('success', 'Registro modificado con éxito')
    return res.json('Registro éxitoso');
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    const result = await pool.query("UPDATE consultas SET estado = 0 WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/consultas');
});


function getFormularioEdit(consulta, info_paciente, especialidad) {
    let html = `<h3>INFORMACIÓN</h3>
    <fieldset>
        <legend>INFORMACIÓN CONSULTA</legend>
        <p>(*) Obligatorio</p>
        <div class="row">
            <div class="col-md-6">
                <div class="form-group">
                    <label>Motivo de la consulta*</label>
                    <textarea name="motivo_consulta" id="motivo_consulta" cols="30" rows="3"
                        class="form-control required">${consulta.motivo_consulta}</textarea>
                </div>
            </div>
            <div class="col-md-6">
                <div class="form-group">
                    <label>Descripción molestia*</label>
                    <textarea name="descripcion_dolencia" id="descripcion_dolencia" cols="30" rows="3"
                        class="form-control required">${consulta.descripcion_dolencia}</textarea>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Hipertensión arterial*</label>
                    <select name="hipertension" id="hipertension" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>TBC Pulmonar*</label>
                    <select name="tbc" id="tbc" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Diabetes*</label>
                    <select name="diabetes" id="diabetes" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Patología mamaria*</label>
                    <select name="mamaria" id="mamaria" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Cardiopatías*</label>
                    <select name="cardiopatias" id="cardiopatias" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>ITS*</label>
                    <select name="its" id="its" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Várices*</label>
                    <select name="varices" id="varices" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Enf. Renal*</label>
                    <select name="renal" id="renal" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Hepatopatías*</label>
                    <select name="hepatopatias" id="hepatopatias" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Tumores genitales*</label>
                    <select name="t_genitales" id="t_genitales" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Enf. gastrointestinal*</label>
                    <select name="gastrointestinal" id="gastrointestinal" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Chagas*</label>
                    <select name="chagas" id="chagas" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-12">
                <label>Alergias/cirugías/tramáticos/medicamentos/transfucionales/otros</label>
                <textarea name="otros" id="otros" cols="30" rows="3"
                    class="form-control">${consulta.hpPersonal.otros}</textarea>
            </div>
        </div>
    </fieldset>
    
    <h3>NO PATOLOGICA PERSONAL</h3>
    <fieldset>
        <legend>HISTORIA NO PATOLOGICA PERSONAL</legend>
        <p>(*) Obligatorio</p>
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Agua potable*</label>
                    <select name="agua" id="agua" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Alcantarillado*</label>
                    <select name="alcantarillado" id="alcantarillado" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Consumo de bebidas alcoholicas*</label>
                    <select name="alcohol" id="alcohol" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Catarsis*</label>
                    <input type="text" name="catarsis" id="catarsis" value="${consulta.hnpPersonal.catarsis}"
                        class="form-control required">
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Diuresis*</label>
                    <input type="text" name="diuresis" id="diuresis" value="${consulta.hnpPersonal.diuresis}"
                        class="form-control required">
                </div>
            </div>
            <div class="col-md-3">
                <div class="form-group">
                    <label>Tabaquicos*</label>
                    <select name="fuma" id="fuma" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-6">
                <div class="form-group">
                    <label>Alimentación/Otros*</label>
                    <textarea name="otros_np" id="otros_np" cols="30" rows="3"
                        class="form-control required">${consulta.hnpPersonal.otros_np}</textarea>
                </div>
            </div>
            <div class="col-md-6">
                <div class="form-group">
                    <label>Observaciones</label>
                    <textarea name="observacion_f" id="observacion_f" cols="30" rows="3"
                        class="form-control">${consulta.hnpPersonal.observacion_f}</textarea>
                </div>
            </div>
        </div>
    </fieldset>
    
    <h3>PATOLOGICO FAMILIAR</h3>
    <fieldset>
        <legend>HISTORIA PATOLOGICA FAMILIAR</legend>
        <p>(*) Obligatorio</p>
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Hipertensión arterial*</label>
                    <select name="f_hipertension" id="f_hipertension" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>TBC Pulmonar*</label>
                    <select name="f_tbc" id="f_tbc" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Diabetes*</label>
                    <select name="f_diabetes" id="f_diabetes" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Patología mamaria*</label>
                    <select name="f_mamaria" id="f_mamaria" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Cardiopatías*</label>
                    <select name="f_cardiopatias" id="f_cardiopatias" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>ITS*</label>
                    <select name="f_its" id="f_its" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Várices*</label>
                    <select name="f_varices" id="f_varices" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Enf. Renal*</label>
                    <select name="f_renal" id="f_renal" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-3">
                <div class="form-group">
                    <label>Hepatopatías*</label>
                    <select name="f_hepatopatias" id="f_hepatopatias" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Tumores genitales*</label>
                    <select name="f_t_genitales" id="f_t_genitales" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Enf. gastrointestinal*</label>
                    <select name="f_gastrointestinal" id="f_gastrointestinal" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
    
            <div class="col-md-3">
                <div class="form-group">
                    <label>Chagas*</label>
                    <select name="f_chagas" id="f_chagas" class="form-control required">
                        <option value="NO">NO</option>
                        <option value="SI">SI</option>
                    </select>
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col-md-12">
                <label>Otros/Observaciones(pariente que padece la patología)</label>
                <textarea name="f_otros" id="f_otros" cols="30" rows="3"
                    class="form-control">${consulta.hfpPersonal.f_otros}</textarea>
            </div>
        </div>
    </fieldset>`;
    // EXAMEN FISICO
    if (especialidad.nombre == 'PEDIATRÍA' || especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'CARDIOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        html += `
        <h3>EXAMEN FÍSICO</h3>
        <fieldset>
            <legend>EXAMEN FÍSICO</legend>
            <p>(*) Obligatorio</p>
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Ex. fisico general. (Conciencia, psiquismo, estado nutricional, fascies)*</label>
                        <textarea name="e_general" id="e_general" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.e_general}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Piel y Faneras*</label>
                        <textarea name="piel" id="piel" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.piel}</textarea>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Craneo cara (ojos, oidos, nariz, boca, faringe)*</label>
                        <textarea name="craneo" id="craneo" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.craneo}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Cuello y Tiroides*</label>
                        <textarea name="cuello" id="cuello" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.cuello}</textarea>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Torax, Mamas, Cardiopulmonar*</label>
                        <textarea name="torax" id="torax" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.torax}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Abdomen*</label>
                        <textarea name="abdomen" id="abdomen" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.abdomen}</textarea>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Genitales, urinario y rectal*</label>
                        <textarea name="genitales" id="genitales" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.genitales}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Columna vertebral y extremidades*</label>
                        <textarea name="columna" id="columna" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.columna}</textarea>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Examen neurológico*</label>
                        <textarea name="neurologico" id="neurologico" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.neurologico}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Impresión diagnóstica*</label>
                        <textarea name="impresion" id="impresion" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.impresion}</textarea>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-12">
                    <div class="form-group">
                        <label>Conducta*</label>
                        <textarea name="conducta" id="conducta" cols="30" rows="3"
                            class="form-control required">${consulta.examen_fisico.conducta}</textarea>
                    </div>
                </div>
            </div>
        
        </fieldset>`;
    }

    // EXAMEN OBSTRETICOS Y GESTASIÓN
    if (especialidad.nombre == 'PEDIATRÍA' || especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        if (info_paciente.genero_id == 2) {
            html += `<h3>INFORMACIÓN OBSTRÉTICA</h3>
            <fieldset>
                <legend>INFORMACIÓN OBSTRÉTICA</legend>
                <p>(*) Obligatorio</p>
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Gestas previas*</label>
                            <input type="number" value="${consulta.obstretico.previas}" name="previas"
                                class="form-control required">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Abortos*</label>
                            <input type="number" value="${consulta.obstretico.abortos}" name="abortos"
                                class="form-control required">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Vaginales*</label>
                            <input type="number" value="${consulta.obstretico.vaginales}" name="vaginales"
                                class="form-control required">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Nacidos vivos*</label>
                            <input type="number" value="${consulta.obstretico.vivos}" name="vivos" class="form-control required">
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Viven*</label>
                            <input type="number" value="${consulta.obstretico.viven}" name="viven" class="form-control required">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Antecedente de gemelares*</label>
                            <select name="gemelares" id="gemelares" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Partos*</label>
                            <input type="number" value="${consulta.obstretico.partos}" name="partos" class="form-control required">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Cesareas*</label>
                            <input type="number" value="${consulta.obstretico.cesareas}" name="cesareas"
                                class="form-control required">
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Nacidos muertos*</label>
                            <input type="number" value="${consulta.obstretico.muertos}" name="muertos"
                                class="form-control required">
                        </div>
                    </div>
            
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Fecha ultimo embarazo</label>
                            <input type="date" value="${consulta.obstretico.fin_eAnterior}" name="fin_eAnterior"
                                class="form-control">
                        </div>
                    </div>
                </div>
            </fieldset>
            
            <h3>GESTACIÓN ACTUAL</h3>
            <fieldset>
                <legend>INFORMACIÓN GESTACIÓN ACTUAL</legend>
                <p>(*) Obligatorio</p>
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Fecha Inicio Gestación</label>
                            <input type="date" value="${consulta.gestacion.fecha}" name="fecha" class="form-control">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Peso inicial</label>
                            <input type="number" value="${consulta.gestacion.peso}" step="0.01" min="0" name="peso"
                                class="form-control">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Uso de drogas*</label>
                            <select name="drogas" id="drogas" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Violencia*</label>
                            <select name="violencia" id="violencia" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Planeado</label>
                            <select name="planeado" id="planeado" class="form-control">
                                <option value="">Seleccione...</option>
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
            
                    <div class="col-md-3">
                        <div class="form-group">
                            <label>Suplementos*</label>
                            <select name="suplemento" id="suplemento" class="form-control">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
            
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>Glucemia en ayunas*</label>
                            <input type="number" value="${consulta.gestacion.glucemia}" min="0" name="glucemia"
                                class="form-control required">
                        </div>
                    </div>
                </div>
            
            </fieldset>`;
        }
    }

    // EXAMEN MORBILIDAD
    if (especialidad.nombre == 'GINECOLOGÍA' || especialidad.nombre == 'ECOGRAFÍA') {
        if (info_paciente.genero_id == 2) {
            html += `
            <h3>CONDICIONES MORBILIDAD</h3>
            <fieldset>
                <legend>CONDICIONES POTENCIALMENTE PELIGROSAS PARA MORBILIDAD</legend>
                <p>(*) Obligatorio</p>
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>Hemorragia*</label>
                            <select name="hemorragia" id="hemorragia" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea name="observacion_hemorragia" id="observacion_hemorragia" cols="30" rows="2"
                                class="form-control">${consulta.morbilidad.observacion_hemorragia}</textarea>
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>Transtornos hipertensivos*</label>
                            <select name="transtornos" id="transtornos" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea name="observacion_transtornos" id="observacion_transtornos" cols="30" rows="2"
                                class="form-control">${consulta.morbilidad.observacion_transtornos}</textarea>
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>Infecciones*</label>
                            <select name="infecciones" id="infecciones" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea name="observacion_infecciones" id="observacion_infecciones" cols="30" rows="2"
                                class="form-control">${consulta.morbilidad.observacion_infecciones}</textarea>
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>Complic. Obstétricas*</label>
                            <select name="obstetricas" id="obstetricas" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea name="observacion_obstetricas" id="observacion_obstetricas" cols="30" rows="2"
                                class="form-control">${consulta.morbilidad.observacion_obstetricas}</textarea>
                        </div>
                    </div>
                </div>
            
                <div class="row">
                    <div class="col-md-4">
                        <div class="form-group">
                            <label>Intervenciones*</label>
                            <select name="intervencion" id="intervencion" class="form-control required">
                                <option value="NO">NO</option>
                                <option value="SI">SI</option>
                            </select>
                        </div>
                    </div>
                    <div class="col-md-8">
                        <div class="form-group">
                            <label>Observaciones</label>
                            <textarea name="observacion_intervencion" id="observacion_intervencion" cols="30" rows="2"
                                class="form-control">${consulta.morbilidad.observacion_intervencion}</textarea>
                        </div>
                    </div>
                </div>
            
            </fieldset>`;
        }
    }

    // EXAMEN ODONTOLOGICO
    if (especialidad.nombre == 'ODONTOLOGÍA') {
        html += `<h3>HISTORIA ODONTOLÓGICA</h3>
        <fieldset>
            <legend>INFORMACIÓN ODONTOLÓGICA</legend>
            <p>(*) Obligatorio</p>
            <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Hemorragia*</label>
                        <select name="o_hemorragia" id="o_hemorragia" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="form-group">
                        <label>Observaciones</label>
                        <textarea name="observacion_hemo" id="observacion_hemo" cols="30" rows="2" class="form-control">${consulta.odontologico.observacion_hemo}</textarea>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label>ATM*</label>
                        <textarea name="atm" id="atm" cols="30" rows="2" class="form-control required">${consulta.odontologico.atm}</textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Ganglios linfáticos*</label>
                        <textarea name="ganglios" id="ganglios" cols="30" rows="2" class="form-control required">${consulta.odontologico.ganglios}</textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Respirador*</label>
                        <textarea name="respirador" id="respirador" cols="30" rows="2" class="form-control required">${consulta.odontologico.respirador}</textarea>
                    </div>
                </div>
            </div>
        
             <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Labios*</label>
                        <textarea name="labios" id="labios" cols="30" rows="2" class="form-control required">${consulta.odontologico.labios}</textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Lengua*</label>
                        <textarea name="lengua" id="lengua" cols="30" rows="2" class="form-control required">${consulta.odontologico.lengua}</textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Paladar*</label>
                        <textarea name="paladar" id="paladar" cols="30" rows="2" class="form-control required">${consulta.odontologico.paladar}</textarea>
                    </div>
                </div>
            </div>
        
             <div class="row">
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Piso de la boca*</label>
                        <textarea name="piso_boca" id="piso_boca" cols="30" rows="2" class="form-control required">${consulta.odontologico.piso_boca}</textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Mucosa Yugal*</label>
                        <textarea name="mucosa" id="mucosa" cols="30" rows="2" class="form-control required">${consulta.odontologico.mucosa}</textarea>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-group">
                        <label>Encias*</label>
                        <textarea name="encias" id="encias" cols="30" rows="2" class="form-control required">${consulta.odontologico.encias}</textarea>
                    </div>
                </div>
            </div>
        
             <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Utiliza prótesis*</label>
                        <select name="protesis" id="protesis" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Utiliza cepillo dental*</label>
                        <select name="cepillo" id="cepillo" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Utiliza hilo dental*</label>
                        <select name="hilo" id="hilo" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Utiliza enjuague bucal*</label>
                        <select name="enjuague" id="enjuague" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>¿Durante el cepillado le sangran las encias?*</label>
                        <select name="sangrado_encias" id="sangrado_encias" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
                <div class="col-md-9">
                    <div class="form-group">
                        <label>Observaciones</label>
                        <textarea name="observaciones" id="observaciones" cols="30" rows="2" class="form-control">${consulta.odontologico.observaciones}</textarea>
                    </div>
                </div>
            </div>
        
        </fieldset>`;
    }

    //   LABORATORIOS
    if (especialidad.nombre == 'LABORATORIOS') {
        html += `<h3>INFORMACIÓN LABORATORIOS</h3>
        <fieldset>
            <legend>INFORMACIÓN LABORATORIOS</legend>
            <p>(*) Obligatorio</p>
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Baciloscopía*</label>
                        <select name="baciloscopia" id="baciloscopia" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Billirrubinas*</label>
                        <select name="billirrubinas" id="billirrubinas" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Comproparasitológico Simple*</label>
                        <select name="c_simple" id="c_simple" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Comproparasitológico Seriado*</label>
                        <select name="c_seriado" id="c_seriado" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Creatínina en orina*</label>
                        <select name="creatinina_orina" id="creatinina_orina" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Creatínina Sérica*</label>
                        <select name="creatinina_serica" icreatininad="" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Cultivo p/germenes comunes y antibiolograma*</label>
                        <select name="cultivo" id="cultivo" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Examen general de orina*</label>
                        <select name="eg_orina" id="eg_orina" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Factor Reumatoide*</label>
                        <select name="f_reumatoide" id="f_reumatoide" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Fosfata alcalina y acida*</label>
                        <select name="fosfata" id="fosfata" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Frotis tinción Gram*</label>
                        <select name="frotis" id="frotis" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Grupo Sanguíneo y factor Rh*</label>
                        <select name="grupo_sanguineo" id="grupo_sanguineo" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Glicemia*</label>
                        <select name="glicemia" id="glicemia" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Gota gruesa y frotis sanguineo - tinción*</label>
                        <select name="gota" id="gota" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Hemoglobina y hematocritico*</label>
                        <select name="hemoglobina" id="hemoglobina" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Hemograma completo*</label>
                        <select name="hemograma" id="hemograma" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Inmunoglobulinas IgG, IgM, IgA*</label>
                        <select name="igg" id="igg" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Moco fecal*</label>
                        <select name="moco" id="moco" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Nitrogeno ureico sérico y úrea*</label>
                        <select name="nitrogeno_usu" id="nitrogeno_usu" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Proteína C Reactiva - PCR*</label>
                        <select name="proteinac" id="proteinac" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Proteinuria de 24 horas*</label>
                        <select name="proteinuria" id="proteinuria" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Prueba de Coombs directa/indirecta*</label>
                        <select name="coombs" id="coombs" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Prueba rapida para sifilis*</label>
                        <select name="sifilis" id="sifilis" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Tiempo coagulación y tiempo de sangria*</label>
                        <select name="coagulacion" id="coagulacion" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Tiempo de protrombia*</label>
                        <select name="protrombia" id="protrombia" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Tinción PAP*</label>
                        <select name="tincion" id="tincion" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Transaminasas TGI-TGP*</label>
                        <select name="transaminasas" id="transaminasas" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Test de embarazo en sangre/HCG*</label>
                        <select name="embarazo" id="embarazo" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
        
            <div class="row">
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Reactantes de fase aguda (VES, Fibrinogeno y PCR)*</label>
                        <select name="reactantes" id="reactantes" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>Reacción Widal*</label>
                        <select name="widal" id="widal" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
        
                <div class="col-md-3">
                    <div class="form-group">
                        <label>RPR para sifilis - VDRL*</label>
                        <select name="rpr" id="rpr" class="form-control required">
                            <option value="NO">NO</option>
                            <option value="SI">SI</option>
                        </select>
                    </div>
                </div>
            </div>
        
            <div class="row">
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Estudios realizados</label>
                        <textarea name="estudios" id="estudios" cols="30" rows="2"
                            class="form-control">${consulta.laboratorio.estudios}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="form-group">
                        <label>Otros estudios realizados</label>
                        <textarea name="otros_estudios" id="otros_estudios" cols="30" rows="2"
                            class="form-control">${consulta.laboratorio.otros_estudios}</textarea>
                    </div>
                </div>
            </div>
        </fieldset>`;
    }

    return html;
}

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

module.exports = router;