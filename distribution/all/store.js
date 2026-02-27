// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 * @typedef {import("../types.js").Hasher} Hasher
 * @typedef {import("../types.js").Node} Node
 */


/**
 * @typedef {Object} StoreConfig
 * @property {string | null} key
 * @property {string} gid
 *
 * @typedef {StoreConfig | string | null} SimpleConfig
 */


/**
 * @param {Config} config
 */
function store(config) {
  const context = {
    gid: config.gid || 'all',
    hash: config.hash || globalThis.distribution.util.id.naiveHash,
    subset: config.subset,
  };

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
        targetKey = configuration;
      }

      // figure out what node to put it in
      const hashkey =distribution.util.id.getID(configuration);
      const nodenid = context.hash(hashkey, nids);
      const remote = {service: "store", method: "get", node: m[nodenid]}
      
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
      const remote = {service: "store", method: "put", node: m[nodenid]}
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
    return callback(new Error('store.append not implemented')); // You'll need to implement this method for the distributed processing milestone.
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
      const remote = {service: "store", method: "del", node: m[nodenid]}

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
    return callback(new Error('store.reconf not implemented'));
  }

  /* For the distributed store service, the configuration will
          always be a string */
  return {get, put, append, del, reconf};
}

module.exports = store;
