class TransmitEncodeTargetNonExistantError extends Error {
    constructor(args){
        super(args);
        this.name = "TransmitEncodeTargetNonExistant"
    }
}

module.exports = {
    TransmitEncodeTargetNonExistantError
}