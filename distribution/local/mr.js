/** @typedef {import("../types").Callback} Callback */

const distribution = globalThis.distribution;
const mr = {
  /**
   * @param {Object} service The map/reduce service object
   * @param {string} mrID The mrID 
   * @param {Callback} callback
   */
  initialize: function(service, mrID, gid, callback) {
    // This allows the orchestrator to 'install' the MR logic on this node
    distribution.local.routes.put(service, mrID, (e, v) => {
        if (e) {
            return callback(e)
        }
        callback(e, v);
    });
  },
};

module.exports = mr;