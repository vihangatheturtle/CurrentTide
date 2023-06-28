// pacHandle is responsible for correctly encoding packets to store and transmit

const errors = require("./ex");
console.verbose("Loaded pacHandle error classes");

const fs = require("fs");
const crypto = require('crypto');
const sha256 = require("../../utils/sha256");
const Readable = require('stream').Readable;
console.verbose("Loaded pacHandle required imports");

// Encrypts `filePath` using `sessionAgreedSyncKey`, the time, and randomness
//
// File Format:
// hybridSyncToken (512)
// encryptedBlock (512)

// Encrypted Block Format:
// timestamp (13)
// encRandomBytes (32)
// iv (16)
function encodePacketIntoTransmitFormat(filePath, sessionAgreedSyncKey, subSyncKey, clientNetworkId, clientPublicKey, personalPrivateKey, cb) {
    console.verbose("[encodePacketIntoTransmitFormat] Starting execution, filePath:", filePath);

    console.verbose("[encodePacketIntoTransmitFormat] Checking if file at \"" + filePath  +"\" exists");
    if (!fs.existsSync(filePath)) {
        console.verbose("[encodePacketIntoTransmitFormat] File at \"" + filePath  +"\" does not exist (TransmitEncodeTargetNonExistantError)");
        throw new errors.TransmitEncodeTargetNonExistantError(`File at "${filePath}" was not found.\nEnsure that the file path is spelt correctly!`)
    }
    console.verbose("[encodePacketIntoTransmitFormat] File at \"" + filePath  +"\" exists, encrypting file with session sync key");

    const creationTimestamp = new Date().getTime().toString();
    const creationTimestampUsedHash = sha256(creationTimestamp);

    const encRandomBytes = crypto.randomBytes(32);
    const randomKeyVariant = sha256(sha256(encRandomBytes) + subSyncKey);

    const seededSyncKey = sha256(clientNetworkId.toString());

    const hybridSyncSeed = crypto.randomBytes(256);
    const hybridSyncToken = crypto.publicEncrypt(clientPublicKey, hybridSyncSeed);

    sessionAgreedSyncKey = sha256(sessionAgreedSyncKey + creationTimestampUsedHash + randomKeyVariant + seededSyncKey + hybridSyncSeed).substr(0, 32);

    console.verbose("[encodePacketIntoTransmitFormat] Session sync key hash has been generated!");
    console.verbose("[encodePacketIntoTransmitFormat] Creation Timestamp Hash:", creationTimestampUsedHash);
    console.verbose("[encodePacketIntoTransmitFormat] Encryption Key:", sessionAgreedSyncKey,);

    // TODO: Sign the packet!

    const iv = crypto.randomBytes(16);
    var cipher = crypto.createCipheriv('aes-256-cbc', sessionAgreedSyncKey, iv);
    var input = fs.createReadStream(filePath);
    var buffers = [];

    // Push hybridSyncToken into buffer output
    buffers.push(hybridSyncToken)

    // Push timestamp into buffer output
    buffers.push(Buffer.from(creationTimestamp))

    // Push random bytes into buffer output
    buffers.push(encRandomBytes)

    // Push iv bytes into buffer output
    buffers.push(iv)

    // Pipe file contents into buffer output
    input.pipe(cipher).on('readable', function() {
        while (true) {
            let buffer = cipher.read();
            if (!buffer) { break; }
            buffers.push(buffer);
        }
    });

    input.on('end', function() {
        var buffer = Buffer.concat(buffers);

        console.verbose('[encodePacketIntoTransmitFormat] Encrypted file written to disk');
        cb(buffer);
    });
}

function decodePacketFromTransmitFormat(packet, clientNetworkId, subSyncKey, sessionAgreedSyncKey, personalPrivateKey) {
    console.verbose("[decodePacketFromTransmitFormat] Starting execution, packet length:", packet.length);
    
    const hybridSyncToken = packet.slice(0, 512);
    const hybridSyncSeed = crypto.privateDecrypt(personalPrivateKey, hybridSyncToken);
    console.verbose("[decodePacketFromTransmitFormat] Extracted hidden hybridSyncSeed from hybridSyncToken");

    const seededSyncKey = sha256(clientNetworkId.toString());

    const creationTimestamp = packet.slice(512, 525).toString();
    const creationTimestampUsedHash = sha256(creationTimestamp);
    console.verbose("[decodePacketFromTransmitFormat] Extracted creationTimestamp");

    const encRandomBytes = packet.slice(525, 557);
    const randomKeyVariant = sha256(sha256(encRandomBytes) + subSyncKey);
    console.verbose("[decodePacketFromTransmitFormat] Extracted randomKeyVariant");

    const iv = packet.slice(557, 573);

    sessionAgreedSyncKey = sha256(sessionAgreedSyncKey + creationTimestampUsedHash + randomKeyVariant + seededSyncKey + hybridSyncSeed).substr(0, 32);
    console.verbose("[decodePacketFromTransmitFormat] Rebuilt sessionAgreedSyncKey using extracted data, decrypting packet");

    const decipher = crypto.createDecipheriv('aes-256-cbc', sessionAgreedSyncKey, iv);

    const encData = packet.slice(573, packet.length);
    console.verbose("[decodePacketFromTransmitFormat] Extracted encData");
    
    var dec = decipher.update(encData);
    dec += decipher.final();
    console.verbose("[decodePacketFromTransmitFormat] Decryption of packet complete!");

    return dec
}

module.exports = {
    encodePacketIntoTransmitFormat,
    decodePacketFromTransmitFormat
}