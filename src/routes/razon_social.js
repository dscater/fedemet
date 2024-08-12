const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');

const multer = require('multer');
const fs = require('fs');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/');
    },
    filename: async (req, file, cb) => {
        let nom_img = 'Logo' + Date.now() + path.extname(file.originalname);
        cb(null, nom_img);
    }
});

const fileFilter = async (req, file, cb) => {
    if (file.mimetype == 'image/jpeg' || file.mimetype == 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
    cb(null, false);
}

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'razon_social';
    const razon_social = await pool.query("SELECT * FROM razon_socials");
    const rs = razon_social[0];
    res.render('razon_social/index', { razon_social: rs, pagina });
});


router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'razon_social';
    const { id } = req.params;
    const razon_social = await pool.query("SELECT * FROM razon_socials WHERE id = ?", [id]);
    const rs = razon_social[0];
    res.render('razon_social/edit', { pagina: pagina, razon_social: rs });
});

router.post('/update/:id', upload.single('logo'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'razon_social';
    const { id } = req.params;
    const razon_social = await pool.query("SELECT * FROM razon_socials WHERE id = ?", [id]);
    const rs = razon_social[0];

    var nom_imagen = rs.logo;
    if (req.file) {
        nom_imagen = req.file.filename;
        img_antiguo = rs.logo;
        if (img_antiguo != 'logo.png') {
            try {
                fs.unlinkSync('src/public/imgs/' + img_antiguo);
            } catch (err) {
                console.error('Algo salio mal', err);
            }
        }
    }

    let registro_update = {};
    registro_update.codigo = req.body.codigo.toUpperCase();
    registro_update.nombre = req.body.nombre.toUpperCase();
    registro_update.alias = req.body.alias.toUpperCase();
    registro_update.ciudad = req.body.ciudad.toUpperCase();
    registro_update.dir = req.body.dir.toUpperCase();
    registro_update.nro_aut = req.body.nro_aut.toUpperCase();
    registro_update.fono = req.body.fono.toUpperCase();
    registro_update.cel = req.body.cel.toUpperCase();
    registro_update.casilla = req.body.casilla.toUpperCase();
    registro_update.correo = req.body.correo.toUpperCase();
    registro_update.logo = nom_imagen;
    registro_update.actividad_economica = req.body.actividad_economica.toUpperCase();

    let rs_actualizado = await pool.query("UPDATE razon_socials SET ? WHERE id = ?", [registro_update, rs.id]);
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/razon_social');

});


module.exports = router;