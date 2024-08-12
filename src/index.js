const express = require('express');
const morgan = require('morgan');
const exhbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const mysqlStore = require('express-mysql-session');
const passport = require('passport');
const {
    database
} = require('./keys');
const pool = require('./database');
const oldInput = require('old-input');

const express_handlebars_sections = require('express-handlebars-sections');
// INICIALIZACIONES
const app = express(); // ejecuta/inicia express
require('./lib/passport')

// CONFIGURACIONES
app.set('port', process.env.PORT || 4000); //setear el puerto si hay uno disponible caso contrario usar el 4000
app.set('views', path.join(__dirname, 'views'))
app.engine('.hbs', exhbs({
    defaultLayout: 'app',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars'),
})); //inicializa el motor de plantillas
app.set('view engine', '.hbs');

// MIDDLEWARE
app.use(session({
    secret: 'textoSessiones',
    resave: false,
    saveUninitialized: true,
    store: new mysqlStore(database)
})) //para usar sessiones
app.use(flash()); //para almacenar variables de session
app.use(morgan('dev')); //VER LO QUE LLEGA AL SERVIDOR
app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// VARIABLES GLOBALES
app.use(async (req, res, next) => {
    //OBTENER LOS DATOS DE RAZON SOCIAL
    const razon_socials = await pool.query("SELECT * FROM razon_socials");
    const razon_social = razon_socials[0];
    var bajos_stock = '';
    var nombreUsuario = '';
    var especialidad = null;
    var datosUsuario = null;
    var doctor = null;
    var datos_usuarios = [];
    var doctors = null;
    var especialidads = null;
    let pacientes = null;
    let paciente = null;
    if (req.isAuthenticated()) {

        // VERIFICAR SI EL USUARIO ESTA RELACIONADO CON "datos_usuarios" o pacientes
        if (req.user.tipo != 'PACIENTE') {
            nombreUsuario = req.user.name;
            datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?", [req.user.id]);
            if (datos_usuarios.length > 0) {
                datosUsuario = datos_usuarios[0];
            }
            if (datosUsuario) {
                nombreUsuario = `${datosUsuario.nombre} ${datosUsuario.paterno} ${datosUsuario.materno}`;

                doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?", [datosUsuario.id]);
                if (doctors.length > 0) {
                    doctor = doctors[0];
                    if (doctor) {
                        especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?", [doctor.especialidad_id]);
                        especialidad = especialidads[0];
                    }
                }
            }
        } else {
            pacientes = await pool.query("SELECT * FROM pacientes WHERE user_id = ?", [req.user.id]);
            paciente = null;
            if (pacientes.length > 0) {
                paciente = pacientes[0];
            }
            nombreUsuario = `${paciente.nombre} ${paciente.paterno} ${paciente.materno}`;
        }
    }

    var http = require('http');
    var hostname = req.headers.host; // hostname = 'localhost'

    const urlbase = 'http://' + hostname;

    app.locals.success = req.flash('success');
    app.locals.error = req.flash('error');
    app.locals.error_ci = req.flash('error_ci');
    app.locals.user = req.user;
    app.locals.razon_social = razon_social;
    app.locals.datosUsuario = datosUsuario;
    app.locals.paciente = paciente;
    app.locals.nombreUsuario = nombreUsuario;
    app.locals.urlbase = urlbase;
    app.locals.doctor = doctor;
    app.locals.especialidad = especialidad;
    next();
});

// RUTAS(ROUTES) - URL's del Servidor
app.use(require('./routes'));
app.use(require('./routes/authentication'));
app.use('/home', require('./routes/home'));
app.use('/users', require('./routes/users'));
app.use('/doctors', require('./routes/doctors'));
app.use('/especialidads', require('./routes/especialidads'));
app.use('/horarios', require('./routes/horarios'));
app.use('/pacientes', require('./routes/pacientes'));
app.use('/razon_social', require('./routes/razon_social'));
app.use('/consultas', require('./routes/consultas'));
app.use('/seguimientos', require('./routes/seguimientos'));
app.use('/tratamientos', require('./routes/tratamientos'));
app.use('/citas', require('./routes/citas'));
app.use('/historial', require('./routes/historial'));
app.use('/reportes', require('./routes/reportes'));
app.use('/productos', require('./routes/productos'));
app.use('/stock_productos', require('./routes/stock_productos'));
app.use('/receta_seguimientos', require('./routes/receta_seguimientos'));
app.use('/tratamientos_pacientes', require('./routes/tratamientos_pacientes'));

// RUTA DE ARCHIVOS PUBLICOS
app.use(express.static(path.join(__dirname, 'public')));

// EMPEZAR EL SERVIDOR
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});