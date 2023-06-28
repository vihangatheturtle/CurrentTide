const crypto = require("crypto");

module.exports = (d, iterations = 1) => {
    iterations--;
    
    var d = crypto.createHash('sha256').update(d).digest('hex');

    for (let i = 0; i < iterations; i++) {
        d = crypto.createHash('sha256').update(d).digest('hex');
    }

    return d;
}