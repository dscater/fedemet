const passport = require('passport');
const pool = require('../database');
const helpers = require('./helpers');
const LocalStrategy = require('passport-local').Strategy;

passport.use('local.login', new LocalStrategy({
    usernameField: 'name',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done)=>{
    const users = await pool.query('SELECT * FROM users WHERE usuario = ?', [username]);
    if(users.length > 0)
    {
        const user = users[0];
        const validation = await helpers.compareHash(password, user.password);
        if(validation)
        {
            nombreUsuario = user.usuario;
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