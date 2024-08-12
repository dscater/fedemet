const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/productos/');
    },
    filename: async (req, file, cb) => {
        let nom_img = req.body.nombre + Date.now() + path.extname(file.originalname);
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

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

router.get('/', async (req, res) => {
    pagina = {};
    pagina.actual = 'productos'

    const productos = await pool.query('SELECT *, date_format(fecha_registro,"%d/%m/%Y") as fecha_registro FROM productos;');
    res.render('productos/index', {
        productos: productos,
        pagina
    });
});

router.get('/create', (req, res) => {
    pagina = {};
    pagina.actual = 'productos';
    res.render('productos/create', {
        pagina: pagina
    });
});

router.post('/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'productos';
    let nom_imagen = 'default.png';
    if (req.file) {
        nom_imagen = req.file.filename;
    } else {
        console.log('SIN ARCHIVOS');
    }
    let cantidad_alerta = 0;
    if(req.body.cantidad_alerta){
        cantidad_alerta = req.body.cantidad_alerta;
    }

    const nuevo_producto = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        cantidad_alerta: cantidad_alerta,
        stock_actual: 0,
        foto: nom_imagen,
        fecha_registro: fechaActual(),
    };

    // INSERTAR EN LA BD
    await pool.query("INSERT INTO productos SET ?", [nuevo_producto]);

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/productos');
});

router.get('/edit/:id', async (req, res) => {
    pagina = {};
    pagina.actual = 'productos';
    const {
        id
    } = req.params;
    const productos = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
    const producto = productos[0];
    res.render('productos/edit', {
        pagina: pagina,
        producto: producto
    });
});

router.post('/update/:id', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'productos';

    const {
        id
    } = req.params;
    const productos = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
    const producto = productos[0];
    let nom_imagen = producto.foto;
    if (req.file) {
        nom_imagen = req.file.filename;
        img_antiguo = producto.foto;
        if(img_antiguo != 'default.png'){
            try {
                fs.unlinkSync('src/public/imgs/productos/' + img_antiguo);
            } catch (err) {
                console.error('Algo salio mal', err);
            }
        }
    }

    let cantidad_alerta = 0;
    if(req.body.cantidad_alerta){
        cantidad_alerta = req.body.cantidad_alerta;
    }

    const producto_update = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        cantidad_alerta: cantidad_alerta,
        foto: nom_imagen,
        fecha_registro: fechaActual(),
    };

    await pool.query("UPDATE productos SET ? WHERE id = ?", [producto_update, producto.id]);
    

    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/productos');
});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;
    await pool.query("DELETE FROM productos WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/productos');
});


/* *************************************** */
/*                  INGRESOS                */
/* *************************************** */
router.get('/ingresos', async (req, res) => {
    pagina = {};
    pagina.actual = 'ingresos'

    const ingresos = await pool.query('SELECT ip.*, date_format(ip.fecha_registro,"%d/%m/%Y") as fecha_registro, p.nombre as producto FROM ingreso_productos ip INNER JOIN productos p ON ip.producto_id = p.id ORDER BY ip.fecha_registro DESC;');
    res.render('productos/ingresos', {
        ingresos: ingresos,
        pagina
    });
});

router.get('/ingresos/create', async(req, res) => {
    pagina = {};
    pagina.actual = 'ingresos';

    const productos = await pool.query('SELECT id, nombre FROM productos;');
    res.render('productos/nuevo_ingreso', {
        pagina: pagina,
        productos: productos
    });
});

router.post('/ingresos/store', upload.single('foto'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'ingresos';
    const nuevo_ingreso = {
        producto_id: req.body.producto_id,
        cantidad: req.body.cantidad,
        fecha_registro: fechaActual(),
    };

    // INSERTAR EN LA BD
    let insert = await pool.query("INSERT INTO ingreso_productos SET ?", [nuevo_ingreso]);
    if(insert.insertId){
        // ACTUALIZA STOCK
        const productos = await pool.query("SELECT id, stock_actual FROM productos WHERE id = ?", [nuevo_ingreso.producto_id]);
        const producto = productos[0];
        let stock_actual = producto.stock_actual;
        stock_actual += parseFloat(nuevo_ingreso.cantidad); 
        await pool.query("UPDATE productos SET stock_actual = ? WHERE id = ?", [stock_actual, producto.id]);
    }

    req.flash('success', 'Registro éxitoso')
    return res.redirect('/productos/ingresos');
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

router.post('/ingresos/destroy/:id', upload.single('foto'), async (req, res, next) => {
    const {
        id
    } = req.params;
    
    // OBTENER INGRESO
    const ingresos = await pool.query("SELECT * FROM ingreso_productos WHERE id = ?", [id]);
    const ingreso = ingresos[0];

    // ACTUALIZAR STOCK PRODUCTO
    const productos = await pool.query("SELECT id, stock_actual FROM productos WHERE id = ?", [ingreso.producto_id]);
    const producto = productos[0];
    let stock_actual = producto.stock_actual;
    stock_actual -= parseFloat(ingreso.cantidad); 
    await pool.query("UPDATE productos SET stock_actual = ? WHERE id = ?", [stock_actual, producto.id]);

    // ELIMINAR INGRESO
    await pool.query("DELETE FROM ingreso_productos WHERE id = ?", [id]);
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/productos/ingresos');
});

router.get('/valida/stock/:id', async(req, res) =>{
    const {
        id
    } = req.params;

    let cantidad = req.query.cantidad;

    const productos = await pool.query("SELECT id, stock_actual,nombre FROM productos WHERE id = ?", [id]);
    const producto = productos[0];

    let stock_disponible = true;
    if(parseFloat(cantidad) > parseFloat(producto.stock_actual)){
        stock_disponible = false;
    }
    
    res.json({ 
        sw: stock_disponible,
        producto: producto,
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

module.exports = router;