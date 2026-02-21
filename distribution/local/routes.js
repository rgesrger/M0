/**
 * @typedef {import("../types").Callback} Callback
 * @typedef {string} ServiceName
 */
const mapping = new Map();
const distribution = globalThis.distribution;
/**
 * @param {ServiceName | {service: ServiceName, gid?: string}} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function get(configuration, callback) {
  let serviceName;
  let gid;
  if (typeof configuration === 'string') {
    serviceName = configuration;
  } else if (typeof configuration === 'object' && configuration !== null) {
    serviceName = configuration.service;
    if (configuration.gid) {
      gid = configuration.gid;
    }
  } else {
    const t = typeof configuration;
    return callback(new Error(`invalid type ${t}`),null);
  }
  if (gid === undefined || gid === "local") {
    if (mapping.has(serviceName)) {
      return callback(null, mapping.get(serviceName));
    }
    if (serviceName in distribution.local) {
      return callback(null, distribution.local[serviceName]);
    }
  }
  if (distribution[gid] && serviceName in distribution[gid]) {
    return callback(null, distribution[gid][serviceName]);
  }
  return callback(new Error(`service name ${configuration} does not exist`));
}

/**
 * @param {object} service
 * @param {string} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function put(service, configuration, callback) {
  mapping.set(configuration, service);
  return callback(null)
}

/**
 * @param {string} configuration
 * @param {Callback} callback
 */
function rem(configuration, callback) {
  if (mapping.has(configuration)) {
    const temp = mapping.get(configuration);
    mapping.delete(configuration);
    return callback(null, temp);
  }
  return callback(new Error('no such element in mapping'));
}

module.exports = {get, put, rem};
