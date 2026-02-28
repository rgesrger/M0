require('../distribution.js')();
const distribution = globalThis.distribution;
const node = distribution.node;
node.start((e) => {
  if (e) {
    console.error('Error starting node:', e);
    process.exit(1);
  }
  console.log(`Node is running on ${node.config.ip}:${node.config.port}`);
});
