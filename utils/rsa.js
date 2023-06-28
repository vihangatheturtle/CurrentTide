const crypto = require("crypto");

module.exports = {
    createKey: (exp = false) => {
        const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
            modulusLength: 4096,
            publicKeyEncoding: {
              type: "pkcs1",
              format: "pem",
            },
            privateKeyEncoding: {
              type: "pkcs1",
              format: "pem",
            },
        });

        if (exp) {
            return JSON.stringify({
                p: publicKey,
                s: privateKey
            })
        }

        return {
            p: publicKey,
            s: privateKey
        }
    }
}