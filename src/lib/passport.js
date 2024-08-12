const passport = require('passport');
const pool = require('../database');
const helpers = require('./helpers');
const LocalStrategy = require('passport-local').Strategy;

passport.use('local.login', new LocalStrategy({
    usernameField: 'name',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done)=>{
    const users = await pool.query('SELECT * FROM users WHERE name = ?', [username]);
    if(users.length > 0)
    {
        const user = users[0];
        const validation = await helpers.compareHash(password, user.password);
        if(validation)
        {
            // VERIFICAR SI EL USUARIO ESTA RELACIONADO CON "datos_usuarios" o pacientes
            nombreUsuario = user.name;
            var datosUsuario = null;
            var datos_usuarios = [];
            
            datos_usuarios = await pool.query("SELECT * FROM datos_usuarios WHERE user_id = ?",[user.id]);
            if(datos_usuarios.length > 0)
            {
                datosUsuario = datos_usuarios[0];
            }
            if(datosUsuario)
            {
                nombreUsuario = `${datosUsuario.nombre} ${datosUsuario.paterno} ${datosUsuario.materno}`;
                
                doctors = await pool.query("SELECT * FROM doctors WHERE datos_usuario_id = ?",[datosUsuario.id]);
                if(doctors.length > 0)
                {
                    doctor = doctors[0];
                    if(doctor)
                    {
                        especialidads = await pool.query("SELECT * FROM especialidads WHERE id = ?",[doctor.especialidad_id]);
                        especialidad = especialidads[0];
                    }
                }
            }
            done(null, user, req.flash('success','Bienvenido(a) '+ nombreUsuario));
        }
        else{
            return done(null, false, req.flash('error','EL usuario o la contraseña son incorrectos.'))
        }
    }
    else{
        return done(null, false, req.flash('error','El usuario no existe'))
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done)=>{
    const users = await pool.query("SELECT * FROM users WHERE id = ?",[id]);
    const user = users[0];
    done(null, user)
});