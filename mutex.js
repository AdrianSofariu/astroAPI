var Mutex = require("async-mutex").Mutex;
// Create and export a shared mutex instance
const postsMutex = new Mutex();
const typesMutex = new Mutex();

module.exports = postsMutex;
module.exports = typesMutex;
