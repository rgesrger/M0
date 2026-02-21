// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */
// handling all
const namestonodes = new Map();
const distribution = globalThis.distribution;
const node = distribution.node;

const cfg = node.config; 
const sid = distribution.util.id.getSID(cfg);
const group = { [sid]: cfg };
put("all", group, (e, v) => {});

/**
 * @param {string} name
 * @param {Callback} callback
 */
function get(name, callback) {
  if (namestonodes.has(name)) {
    return callback(null, namestonodes.get(name));
  }
  else {
    return callback(new Error('name not found'));
  }
  
}

/**
 * @param {Config | string} config
 * @param {Object.<string, Node>} group
 * @param {Callback} callback
 */
function put(config, group, callback) {
  
  let gid;
  if (typeof config === "string") {
    gid = config
  } else{
    gid =config.gid
  }
  namestonodes.set(gid, group);
  distribution[gid] ={}
  const services = Object.keys(distribution.all);
  
  for (const service of services) {
    if (service in distribution.all) {
      distribution[gid][service] = require(`../all/${service}.js`)({gid:gid})
    }
  }
  return callback(null, namestonodes.get(config));
}

/**
 * @param {string} name
 * @param {Callback} callback
 */
function del(name, callback) {
  if (namestonodes.has(name)) {
    const deleted = namestonodes.get(name)
    namestonodes.delete(name);
    delete distribution[name];
    return callback(null, deleted);
  }
  else {
    return callback(new Error('name not found'));
  }
}

/**
 * @param {string} name
 * @param {Node} node
 * @param {Callback} callback
 */
function add(name, node, callback) {
  if (namestonodes.has(name)) {
    const sid = distribution.util.id.getSID(node)
    const g = namestonodes.get(name);
    g[sid] = node;
    if (typeof callback === 'function') {
      return callback(null, g);
    }
  }
  else {
    if (typeof callback === 'function') {
      return callback(new Error('name not found'));
    }
  }
};

/**
 * @param {string} name
 * @param {string} node
 * @param {Callback} callback
 */
function rem(name, node, callback) {  
  if (namestonodes.has(name)) {
    const g = namestonodes.get(name);
    delete g[node];
    return callback(null, node);
  }
  else {
    return callback(new Error('name not found'));
  }
};

module.exports = {get, put, del, add, rem};
