// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 *
 * @typedef {Object} Mem
 * @property {(configuration: SimpleConfig, callback: Callback) => void} get
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} put
 * @property {(state: any, configuration: SimpleConfig, callback: Callback) => void} append
 * @property {(configuration: SimpleConfig, callback: Callback) => void} del
 * @property {(configuration: Object.<string, Node>, callback: Callback) => void} reconf
 */


/**
 * @param {Config} config
 * @returns {Mem}
 */
const distribution = globalThis.distribution;
const crypto = require('crypto');
const { loadEnvFile } = require("process");
function mem(config) {
  const context = {};
  context.gid = config.gid || 'all';
  context.hash = config.hash || globalThis.distribution.util.id.naiveHash;

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function get(configuration, callback) {
    
    let gid = context.gid;
    distribution.local.groups.get(gid, (e,v) =>{
      if (e) {
        return callback(new Error());
      }
      const sids = Object.keys(v);
      let nids = [];
      const m = {}
      for (const sid of sids) {
        let nid = distribution.util.id.getNID(v[sid]);
        nids.push(nid);
        m[nid] = v[sid];
      }
      //
      let targetKey;
      if (typeof configuration === 'object') {
        targetKey = configuration.key;
        if (configuration.gid) gid = configuration.gid;
      } else {
        if (configuration ===null) {
          targetKey = null;
        } else{
          targetKey = configuration;
        }
      }

      // figure out what node to put it in
      const hashkey =distribution.util.id.getID(configuration);
      const nodenid = context.hash(hashkey, nids);
      const remote = {service: "mem", method: "get", node: m[nodenid]}
      // to encode gid inside
      const confobj = {key: targetKey, gid: gid}
      distribution.local.comm.send([confobj], remote, (e,v) => {
        if (e) {
          return callback(new Error("error in getting"));
        } else {
          return callback(null, v);
        }
      })
    })
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function put(state, configuration, callback) {

    let gid = context.gid;
    distribution.local.groups.get(gid, (e,v) =>{
      if (e) {
        return callback(e);
      }
      const sids = Object.keys(v);
      let nids = [];
      const m = {}
      for (const sid of sids) {
        let nid = distribution.util.id.getNID(v[sid]);
        nids.push(nid);
        m[nid] = v[sid];
      }

      // figure out what node to put it in
      let targetKey;
      if (configuration === null) {
        targetKey = distribution.util.id.getID(state);
      } else if (typeof configuration === 'object') {
        targetKey = configuration.key;
        if (configuration.gid) gid = configuration.gid;
      } else {
        targetKey = configuration;
      }

      const hashkey = distribution.util.id.getID(targetKey);
      const nodenid = context.hash(hashkey, nids);
      const remote = {service: "mem", method: "put", node: m[nodenid]}

      // to encode gid inside
      const confobj = {key: targetKey, gid: gid}
      distribution.local.comm.send([state, confobj], remote, (e,v) => {
        if (e) {
          return callback(e);
        } else {
          return callback(null, v);
        }
      })
    })
  
  }

  /**
   * @param {any} state
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function append(state, configuration, callback) {
    return callback(new Error('mem.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
  }

  /**
   * @param {SimpleConfig} configuration
   * @param {Callback} callback
   */
  function del(configuration, callback) {
    let gid = context.gid;
    distribution.local.groups.get(gid, (e,v) =>{
      if (e) {
        return callback(new Error());
      }
      
      const sids = Object.keys(v);
      let nids = [];
      const m = {}
      for (const sid of sids) {
        let nid = distribution.util.id.getNID(v[sid]);
        nids.push(nid);
        m[nid] = v[sid];
      }

      let targetKey;
      if (typeof configuration === 'object') {
        targetKey = configuration.key;
        if (configuration.gid) gid = configuration.gid;
      } else {
        targetKey = configuration;
      }
      // figure out what node to put it in
      const hashkey =distribution.util.id.getID(targetKey);
      const nodenid = context.hash(hashkey, nids);
      const remote = {service: "mem", method: "del", node: m[nodenid]}
      const confobj = {key: targetKey, gid: gid}
      distribution.local.comm.send([confobj], remote, (e,v) => {
        if (e) {
          return callback(new Error());
        } else {
          return callback(null, v);
        }
      })
    })
  }

  /**
   * @param {Object.<string, Node>} configuration
   * @param {Callback} callback
   */
  function reconf(configuration, callback) {
    return callback(new Error('mem.reconf not implemented'));
  }
  /* For the distributed mem service, the configuration will
          always be a string */
  return {
    get,
    put,
    append,
    del,
    reconf,
  };
}

module.exports = mem;
