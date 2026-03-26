// @ts-check
/**
 * @typedef {import("../types.js").Callback} Callback
 * @typedef {import("../types.js").Config} Config
 */

/**
 * NOTE: This Target is slightly different from local.all.Target
 * @typedef {Object} Target
 * @property {string} service
 * @property {string} method
 * @property {string} [gid]
 *
 * @typedef {Object} Comm
 * @property {(message: any[], configuration: Target, callback: Callback) => void} send
 */

/**
 * @param {Config} config
 * @returns {Comm}
 */
function comm(config) {
  const context = {};
  context.gid = config.gid || 'all';
  const distribution = globalThis.distribution;
  /**
   * @param {any[]} message
   * @param {Target} configuration
   * @param {Callback} callback
   */
  // calls local comm.send for each node in
  function send(message, configuration, callback) {
    let targetgid;
    if (configuration.gid){
      targetgid = configuration.gid;
    } else{
      targetgid = context.gid;
    }

    distribution.local.groups.get(targetgid, (e,v) => {
      const sids = Object.keys(v);
      const total = sids.length;
      if (total ===0) {
        return callback(new Error("group cannot be empty"), null);
      }
      let completed = 0;
      const errors = {};
      const results = {};

      for (const sid of sids) {
        const nodeobj = v[sid];
        let remote = {
          ...configuration,
          node:nodeobj,
        };
        distribution.local.comm.send(message, remote, (e,v) => {
          if(e) {
            errors[sid] = e;
          }
          if (v){
            results[sid] = v;
          }
          completed ++;

          if(completed === total) {
            const finalerr = Object.keys(errors).length > 0 ? errors : {};
            // console.log("all comm finished errors", finalerr, "results", results);
            callback(finalerr, results);
          }
        })
      }  
    })
  }
  return {send};
}

module.exports = comm;
