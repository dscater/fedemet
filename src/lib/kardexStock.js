const pool = require('../database')
const historialAccion = {};

historialAccion.incrementarStock = async (producto_id, cantidad) =>{

    const ingreso_productos = await pool.query("SELECT stock_actual FROM productos WHERE id = ?", [producto_id]);
    if(ingreso_productos.length > 0){
        let ingreso_producto = ingreso_productos[0];
        let stock_update = {
            stock_actual: parseFloat(ingreso_producto.stock_actual) + parseFloat(cantidad)
        };
        await pool.query("UPDATE productos SET ? WHERE id = ?", [stock_update, producto_id])
        historialAccion.registrarFechaStock(producto_id,fechaActual());
    }
    return true;
}

historialAccion.decrementarStock = async (producto_id, cantidad) =>{
    const ingreso_productos = await pool.query("SELECT stock_actual FROM productos WHERE id = ?", [producto_id]);
    if(ingreso_productos.length > 0){
        let ingreso_producto = ingreso_productos[0];
        let stock_update = {
            stock_actual: parseFloat(ingreso_producto.stock_actual) - parseFloat(cantidad)
        };
        await pool.query("UPDATE productos SET ? WHERE id = ?", [stock_update, producto_id])
        historialAccion.registrarFechaStock(producto_id,fechaActual());
    }
    return true;
}

historialAccion.registrarFechaStock = async (producto_id, fecha) =>{

    const fecha_stocks = await pool.query("SELECT * FROM fecha_stocks WHERE producto_id = ? AND fecha = ?", [producto_id,fecha]);
    const productos = await pool.query("SELECT * FROM productos WHERE id = ?", [producto_id]);
    let producto = productos[0];
    if(productos.length > 0){
        if(fecha_stocks.length > 0){
            let fecha_stock = fecha_stocks[0];
            let stock_update = {
                stock: producto.stock_actual
            };
            await pool.query("UPDATE fecha_stocks SET ? WHERE id = ?", [stock_update, fecha_stock.id])
        }else{
            let stock_store = {
                producto_id:producto.id,
                stock: producto.stock_actual,
                fecha:fecha
            };
            await pool.query("INSERT INTO fecha_stocks SET ?", [stock_store])
            
        }
    }
    return true;
}

historialAccion.registroIngreso = async (tipo_registro, registro_id = 0, producto_id, cantidad, precio, detalle='') =>{

    // ultimo registro
    const ultimos = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? ORDER BY id DESC",[producto_id]);
    const productos = await pool.query("SELECT * FROM productos WHERE id=?",[producto_id]);
    let ultimo = ultimos.length > 0 ? ultimos[0]:null;
    let producto = productos.length > 0 ? productos[0]:null;
    if(producto){
        let monto = cantidad * producto.precio;
        let detalle_txt ="INGRESO DE PRODUCTO";
        if(ultimo){
            if(detalle != ''){
                detalle_txt = detalle;
            }
    
            let nuevo_registro = {
                tipo_registro: tipo_registro,
                registro_id: registro_id,
                producto_id: producto_id,
                detalle: detalle_txt,
                precio: producto.precio,
                tipo_is: 'INGRESO',
                cantidad_ingreso: cantidad,
                cantidad_saldo: parseFloat(ultimo.cantidad_saldo) + parseFloat(cantidad),
                cu:producto.precio,
                monto_ingreso:monto,
                monto_saldo: parseFloat(ultimo.monto_saldo) + parseFloat(monto),
                fecha:fechaActual(),
            };
            await pool.query("INSERT INTO kardex_productos SET ?",[nuevo_registro])
        }else{
            detalle_txt = 'VALOR INICIAL';
            let nuevo_registro = {
                tipo_registro: tipo_registro,
                registro_id: registro_id,
                producto_id: producto_id,
                detalle: detalle_txt,
                precio: producto.precio,
                tipo_is: 'INGRESO',
                cantidad_ingreso: cantidad,
                cantidad_saldo: cantidad,
                cu:producto.precio,
                monto_ingreso:monto,
                monto_saldo: monto,
                fecha:fechaActual(),
            };
            await pool.query("INSERT INTO kardex_productos SET ?",[nuevo_registro])
        }
        historialAccion.incrementarStock(producto.id,cantidad);
    }

    return true;
}

historialAccion.registroEgreso = async (tipo_registro, registro_id = 0, producto_id, cantidad, precio, detalle='') =>{

    // ultimo registro
    const ultimos = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? ORDER BY id DESC",[producto_id]);
    const productos = await pool.query("SELECT * FROM productos WHERE id=?",[producto_id]);
    let ultimo = ultimos.length > 0 ? ultimos[0]:null;
    let producto = productos.length > 0 ? productos[0]:null;
    if(producto){
        let monto = cantidad * producto.precio;
        let detalle_txt ="SALIDA DE PRODUCTO";
        if(detalle != ''){
            detalle_txt = detalle;
        }

        let nuevo_registro = {
            tipo_registro: tipo_registro,
            registro_id: registro_id,
            producto_id: producto_id,
            detalle: detalle_txt,
            precio: producto.precio,
            tipo_is: 'EGRESO',
            cantidad_ingreso: cantidad,
            cantidad_saldo: parseFloat(ultimo.cantidad_saldo) - parseFloat(cantidad),
            cu:producto.precio,
            monto_ingreso:monto,
            monto_saldo: parseFloat(ultimo.monto_saldo) - parseFloat(monto),
            fecha:fechaActual(),
        };
        await pool.query("INSERT INTO kardex_productos SET ?",[nuevo_registro])

        historialAccion.decrementarStock(producto.id,cantidad);
    }

    return true;
}


historialAccion.actualizaRegistrosKardex = async (id,producto_id) =>{
    // siguientes
    try{
        const siguientes = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? AND id >= ?",[producto_id,id]);
        for(const elem of siguientes) {
            let anteriores = await pool.query("SELECT * FROM kardex_productos WHERE producto_id=? AND id < ? ORDER BY id DESC",[producto_id,elem.id]);
            let anterior = anteriores[0];
            let datos_actualizacion = {
                precio:0,
                cantidad_ingreso:null,
                cantidad_salida:null,
                cantidad_saldo:0,
                cu:0,
                monto_ingreso:null,
                monto_salida:null,
                monto_saldo:0,
            };
    
            let producto = null;
            let ingreso_producto = null;
            let salida_producto = null;
            let detalle_orden = null;
            let resultados = [];
            switch(elem.tipo_registro){
                case 'INGRESO':
                        resultados = await pool.query("SELECT * FROM ingreso_productos WHERE id =?",[elem.registro_id]);
                        ingreso_producto = resultados[0]
                        resultados = await pool.query("SELECT * FROM productos WHERE id=?",[ingreso_producto.producto_id]) 
                        producto = resultados[0]
                        monto = parseFloat(ingreso_producto.cantidad) * parseFloat(producto.precio);
                        if (anterior) {
                            datos_actualizacion["precio"] = producto.precio;
                            datos_actualizacion["cantidad_ingreso"] =  ingreso_producto.cantidad;
                            datos_actualizacion["cantidad_saldo"] = parseFloat(anterior.cantidad_saldo) + parseFloat(ingreso_producto.cantidad);
                            datos_actualizacion["cu"] = producto.precio;
                            datos_actualizacion["monto_ingreso"] = monto;
                            datos_actualizacion["monto_saldo"] = parseFloat(anterior.monto_saldo) + parseFloat(monto);
                        } else {
                            datos_actualizacion["precio"] = producto.precio;
                            datos_actualizacion["cantidad_ingreso"] =  ingreso_producto.cantidad;
                            datos_actualizacion["cantidad_saldo"] = parseFloat(ingreso_producto.cantidad);
                            datos_actualizacion["cu"] = producto.precio;
                            datos_actualizacion["monto_ingreso"] = monto;
                            datos_actualizacion["monto_saldo"] = monto;
                        }
                        break;
                    case 'SALIDA':
                        resultados = await pool.query("SELECT * FROM salida_productos WHERE id =?",[elem.registro_id]);
                        salida_producto = resultados[0]
                        resultados = await pool.query("SELECT * FROM productos WHERE id=?",[salida_producto.producto_id]) 
                        producto = resultados[0]
                        monto = parseFloat(salida_producto.cantidad) * parseFloat(producto.precio);
    
                        if (anterior) {
                            datos_actualizacion["precio"] = producto.precio;
                            datos_actualizacion["cantidad_salida"] =  salida_producto.cantidad;
                            datos_actualizacion["cantidad_saldo"] = parseFloat(anterior.cantidad_saldo) - parseFloat(salida_producto.cantidad);
                            datos_actualizacion["cu"] = producto.precio;
                            datos_actualizacion["monto_salida"] = monto;
                            datos_actualizacion["monto_saldo"] =  parseFloat(anterior.monto_saldo) - parseFloat(monto);
                        } else {
                            datos_actualizacion["precio"] = producto.precio;
                            datos_actualizacion["cantidad_salida"] =  salida_producto.cantidad;
                            datos_actualizacion["cantidad_saldo"] = parseFloat(salida_producto.cantidad) * (-1);
                            datos_actualizacion["cu"] = producto.precio;
                            datos_actualizacion["monto_salida"] = monto;
                            datos_actualizacion["monto_saldo"] = monto * (-1);
                        }
    
                        break;
                    case 'VENTA':
                        resultados = await pool.query("SELECT * FROM detalle_ventas WHERE id =?",[elem.registro_id]);
                        detalle_orden = resultados[0]
                        monto = parseFloat(detalle_orden.cantidad) * parseFloat(detalle_orden.precio);
                        if (anterior) {
                            datos_actualizacion["precio"] = detalle_orden.precio;
                            datos_actualizacion["cantidad_salida"] =  detalle_orden.cantidad;
                            datos_actualizacion["cantidad_saldo"] = parseFloat(anterior.cantidad_saldo) - parseFloat(detalle_orden.cantidad);
                            datos_actualizacion["cu"] = detalle_orden.precio;
                            datos_actualizacion["monto_salida"] = monto;
                            datos_actualizacion["monto_saldo"] =  parseFloat(anterior.monto_saldo) - parseFloat(monto);
                        } else {
                            datos_actualizacion["precio"] = detalle_orden.precio;
                            datos_actualizacion["cantidad_salida"] =  detalle_orden.cantidad;
                            datos_actualizacion["cantidad_saldo"] = parseFloat(detalle_orden.cantidad)* (-1);
                            datos_actualizacion["cu"] = detalle_orden.precio;
                            datos_actualizacion["monto_salida"] = monto;
                            datos_actualizacion["monto_saldo"] = monto * (-1);
                        }
                        break;
            }
    
            await pool.query("UPDATE kardex_productos SET ? WHERE id = ?",[datos_actualizacion,elem.id])
        }
        return true;
    }catch(err){
        console.error('Error en actualizaRegistrosKardex:', err);
        return false;
    }
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

function horaActual() {
    let date = new Date();

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();

    // Formateo para agregar un cero a la izquierda si es necesario
    if (hours < 10) hours = `0${hours}`;
    if (minutes < 10) minutes = `0${minutes}`;
    if (seconds < 10) seconds = `0${seconds}`;

    return `${hours}:${minutes}:${seconds}`;
}

module.exports = historialAccion