const logger = require("./log");

var key = null;

// Set application log-level (3 == verbose)
// TODO: Change this to use command line args!
logger.setLogLevel(3);
console.verbose("Loaded logger");

const pacHandle = require("./lib/pacHandle/main.js");
console.verbose("Loaded pacHandle");

const rsa = require("./utils/rsa");
const fs = require("fs");
const { exit } = require("process");
console.verbose("Loaded required imports");

// Attempt to load our key
if (!fs.existsSync(".key")) {
    console.error("No personal encryption keypair found, please generate one first!\nTry using:\n  rsa.createKey(true)")
    exit(1)
}
key = Buffer.from(JSON.parse(fs.readFileSync(".key").toString()).s);




// VVVVVVV    TESTING    VVVVVVV

console.verbose("[!!!TESTING!!!] Generating a fake \"client\" public key for testing")
const pretendClientKey = rsa.createKey();
const pretendClientPublicKey = pretendClientKey.p;
const pretendClientPrivateKey = pretendClientKey.s;

pacHandle.encodePacketIntoTransmitFormat("test.txt", "test", "bob", 123, pretendClientPublicKey, key, packet => {
    const res = pacHandle.decodePacketFromTransmitFormat(packet, 123, "bob", "test", pretendClientPrivateKey);

    console.log(res);
});