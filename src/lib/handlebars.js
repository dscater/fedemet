const helpers = {};

helpers.section = function (name, options) {
    if (!this._sections) { this._sections = {} };
    this._sections[name] = options.fn(this);
    return null;
};

helpers.checkPhoto = function(foto, options) {
    return foto ? foto : 'user_default.png';
};

helpers.if_equal = function (a, b, opts) {
    if (a == b) {
        console.log("FFF");
        console.log(a);
        console.log(opts.fn(this) + "SSS");
        return opts.fn(this)
    } else {
        return opts.inverse(this)
    }
};

helpers.menor_igual_que = function (a, b, opts) {
    if (parseFloat(a) <= parseFloat(b)) {
        return opts.fn(this)
    } else {
        return opts.inverse(this)
    }
};


helpers.switch = function (value, options) {
    this.switch_value = value;
    return options.fn(this);
};

helpers.case = function (value, options) {
    if (value == this.switch_value) {
        return options.fn(this);
    }
};

helpers.default = function (value, options) {
    return true; ///We can add condition if needs
};

module.exports = helpers;