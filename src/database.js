const mysql = require('mysql');
const {promisify} = require('util');

const {database} = require('./keys');//obtener el objeto database

const pool = mysql.createPool(database);//iniciar la conexion con POOL

pool.getConnection((err, connection)=>{
    if(err){
        if(err.code === 'PROTOCOL_CONNECTION_LOST')
        {
            console.log('ERROR, CONEXION DE BASE DE DATOS CERRADA');
        }
        if(err.code === 'ER_CON_COUNT_ERROR')
        {
            console.log('LA CONEXION TIENE DEMASIADAS CONEXIONES');
        }
        if(err.code ===  'ECONNREFUSED')
        {
            console.log('ERROR EN LA CONEXION');
        }
    }

    if(connection) connection.release();
    console.log('DB CONEXIÓN CORRETA');
    return
});

pool.query = promisify(pool.query);//call back a promesas
pool.getConnection = promisify(pool.getConnection); // promisificar getConnection

module.exports = pool;

