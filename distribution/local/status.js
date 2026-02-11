// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Node} Node
 */

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  const distribution = globalThis.distribution;
  const config = distribution.node.config;
  if (configuration === "sid") {
    return callback(null, distribution.util.id.getSID(config));
  }
  if (configuration === "nid") {
    return callback(null, distribution.util.id.getNID(config));
  }
  if (configuration === "ip") {
    return callback(null, config.ip);
  }
  if (configuration === "port") {
    return callback(null, config.port);
  }
  if (configuration === "heapTotal" ) {
    return callback(null, process.memoryUsage().heapTotal);
  }
  if (configuration === "heapUsed") {
    return callback(null, process.memoryUsage().heapUsed)
  }
  if (configuration === "counts") {
    if (distribution.node.msgcount === undefined) {
        distribution.node.msgcount = 0;
      }
    return callback(null, distribution.node.msgcount);
  }
  
  return callback(new Error('configuration not supported'));
};


/**
 * @param {Node} configuration
 * @param {Callback} callback
 */
function spawn(configuration, callback) {
  callback(new Error('status.spawn not implemented'));
}

/**
 * @param {Callback} callback
 */
function stop(callback) {
  callback(new Error('status.stop not implemented'));
}

module.exports = {get, spawn, stop};
