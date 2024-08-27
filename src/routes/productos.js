const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../database');
const historialAccion = require('../lib/historialAccion');
const helpers = require('../lib/helpers');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'src/public/imgs/productos/');
    },
    filename: async (req, file, cb) => {
        let nom_img = Date.now() + path.extname(file.originalname);
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

    const productos = await pool.query("SELECT p.*, DATE_FORMAT(p.fecha_registro, '%Y-%m-%d') as fecha_registro, m.nombre as nombre_marca FROM productos p INNER JOIN marcas m ON p.marca_id = m.id WHERE p.estado = 1");
    res.render('productos/index', {
        productos: productos,
        pagina
    });
});

router.get('/create',async (req, res) => {
    pagina = {};
    pagina.actual = 'productos';

    const marcas = await pool.query("SELECT id,nombre FROM marcas WHERE estado = 1");
    res.render('productos/create', {
        pagina: pagina,
        marcas
    });
});

router.post('/store', upload.single('imagen'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'productos';
    let nom_imagen = 'default.png';
    if (req.file) {
        nom_imagen = req.file.filename;
    } else {
        console.log('SIN ARCHIVOS');
    }
    let rows = await pool.query("SELECT * FROM productos ORDER BY id DESC");
    let codigo_producto = "PRO.";
    let nro_codigo = 1;
    if (rows.length > 0) {
        nro_codigo = parseInt(rows[0].nro_codigo) + 1;
    }
    codigo_producto = codigo_producto + nro_codigo;

    let nuevo_producto = {
        codigo_producto: codigo_producto,
        nro_codigo: nro_codigo,
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        precio: req.body.precio,
        stock_min: req.body.stock_min,
        stock_actual:0,
        marca_id: req.body.marca_id,
        imagen: nom_imagen,
        fecha_registro:fechaActual(),
    };

    let nr_producto = await pool.query("INSERT INTO productos SET ?", [nuevo_producto]);
    await historialAccion.registraAccion(req.user.id,"CREACIÓN","EL USUARIO "+req.user.usuario+" CREO UN PRODUCTO", nuevo_producto,null,"PRODUCTOS")
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
    const marcas = await pool.query("SELECT id,nombre FROM marcas WHERE estado = 1");
    res.render('productos/edit', {
        pagina: pagina,
        producto: producto,
        marcas
    });
});

router.get('/getProducto/:id', async (req, res) => {
    const {
        id
    } = req.params;
    const {cantidad} =req.query;
    try {
        const productos = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
        const producto = productos[0];
        
        // Verificar si es una petición AJAX
        if (req.xhr) {
            // Responder con JSON
            if(producto.stock_actual < parseFloat(cantidad)){
                return res.status(400).json({ error: `El stock actual del producto ${producto.codigo_producto}|${producto.nombre} es de ${producto.stock_actual}, insuficiente para la cantidad solicitada` });
            }
            return res.json({ producto });
        } else{
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        return res.status(500).json({ error: 'Error al obtener el producto.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error al obtener el producto.' });
    }
});

router.post('/update/:id', upload.single('imagen'), async (req, res, next) => {
    pagina = {};
    pagina.actual = 'productos';

    const {
        id
    } = req.params;
    const productos = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
    const producto = productos[0];
    var nom_imagen = producto.imagen;
    if (req.file) {
        nom_imagen = req.file.filename;
        img_antiguo = producto.imagen;
        if(img_antiguo && img_antiguo != 'default.png'){
            try {
                fs.unlinkSync('src/public/imgs/productos/' + img_antiguo);
            } catch (err) {
                console.error('Algo salio mal', err);
            }
        }
    }

    let producto_update = {
        nombre: req.body.nombre.toUpperCase(),
        descripcion: req.body.descripcion.toUpperCase(),
        precio: req.body.precio,
        stock_min: req.body.stock_min,
        marca_id: req.body.marca_id,
        imagen: nom_imagen,
    };
    let nr_producto = await pool.query("UPDATE productos SET ? WHERE id = ?", [producto_update, producto.id]);
    
    await historialAccion.registraAccion(req.user.id,"MODIFICACIÓN","EL USUARIO "+req.user.usuario+" MODIFICO UN USAURIO", producto,producto_update,"USAURIOS")
    req.flash('success', 'Registro modificado con éxito')
    return res.redirect('/productos');

});

router.post('/destroy/:id', async (req, res, next) => {
    const {
        id
    } = req.params;

    const productos = await pool.query("SELECT * FROM productos WHERE id = ?", [id]);
    const producto = productos[0];

    const result = await pool.query("UPDATE productos SET estado = 0 WHERE id = ?", [id]);

    await historialAccion.registraAccion(req.user.id,"ELIMINACIÓN","EL USUARIO "+req.user.usuario+" ELIMINO UN PRODUCTO", producto,null,"PRODUCTOS")
    req.flash('success', 'Registro eliminado con éxito')
    return res.redirect('/productos');
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