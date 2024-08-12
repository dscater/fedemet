const bcrypt = require('bcryptjs');
const helpers = {};

helpers.encryptText = async (cadena) => {
    const salt = await bcrypt.genSalt(10);//iniciando el HASH
    const hash = await bcrypt.hash(cadena, salt);
    return hash;
};

helpers.compareHash = async(cadena, cadena_hash) => {
    try{
        return await bcrypt.compare(cadena, cadena_hash);
    }
    catch(e)
    {
        console.log(e);
        return false;
    }
};

module.exports = helpers;