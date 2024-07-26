const {v4: uuidv4} = require("uuid");
const Hashids = require("hashids");
const hashids = new Hashids();


const deHyphenatedUUID = () => uuidv4().replace(/-/gi, "");
const encodedId = () => hashids.encodeHex(deHyphenatedUUID());




module.exports = {encodedId}