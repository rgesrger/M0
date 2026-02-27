/**
 * @typedef {import("../types.js").Callback} Callback
 *
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string | null} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
const map = new Map();
function put(state, configuration, callback) {
  if (configuration===null) {
    configuration = globalThis.distribution.util.id.getID(state);
  }
  map.set(configuration, state)
  return callback(null, state);
};

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  return callback(new Error('mem.append not implemented'));
};

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  if (map.has(configuration)) {
    return callback(null, map.get(configuration))
  } else{
    return callback(new Error())
  }
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  if (map.has(configuration)) {
    const todelete = map.get(configuration);
    map.delete(configuration);
    return callback(null, todelete);
  } else{
    return(callback(new Error("key not found")));
  }
};

module.exports = {put, get, del, append};
