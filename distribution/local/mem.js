// @ts-check
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
  let key;
  let gid = null;
  if (configuration===null) {
    key = globalThis.distribution.util.id.getID(state);
  } else{
    if (typeof configuration === "string") {
      key = configuration;
    } else{
      key = configuration.key;
      gid = configuration.gid;
    }
  }
  if (gid !== null) {
    map.set(`${gid}:${key}`, state)
  } else {
    map.set(key, state)
  }
  
  return callback(null, state);
};

/**
 * @param {any} state
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function append(state, configuration, callback) {
  return callback(new Error('mem.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
};

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function get(configuration, callback) {
  let key;
  let gid = null;
  if (typeof configuration === "string") {
    key = configuration;
  } else{
    key = configuration.key;
    gid = configuration.gid;
  }
  if (gid !== null) {
    key = `${gid}:${key}`
  }
  if (map.has(key)) {
    if (gid !== null) {
      return callback(null, map.get(key))
    }else {
      return callback(null, map.get(key))
    }
  } else{
    return callback(new Error("no key available"))
  }
}

/**
 * @param {SimpleConfig} configuration
 * @param {Callback} callback
 */
function del(configuration, callback) {
  let key;
  let gid = null;
  if (typeof configuration === "string") {
    key = configuration;
  } else{
    key = configuration.key;
    gid = configuration.gid;
  }
  if (gid !== null) {
    key = `${gid}:${key}`
  }
  if (map.has(key)) {
    const todelete = map.get(key);
    map.delete(key);
    return callback(null, todelete);
  } else{
    return(callback(new Error("key not found")));
  }
};

module.exports = {put, get, del, append};
