/**
 * @typedef {import("../types").Callback} Callback
 * @typedef {string} ServiceName
 */
const mapping = new Map()
distribution = globalThis.distribution;
/**
 * @param {ServiceName | {service: ServiceName, gid?: string}} configuration
 * @param {Callback} callback
 * @returns {void}
 */
function get(configuration, callback) {
  let serviceName;
  if (typeof configuration === "string") {
    serviceName = configuration;
  } else {
    serviceName = configuration.service;
}
  if (mapping.has(serviceName)) {
    return callback(null, mapping.get(serviceName));
  }
  if (serviceName in distribution.local) {
    return callback(null, distribution.local[serviceName]);
  }
  return callback(new Error(`service name ${configuration} not in map`));
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
