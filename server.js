require('@brown-ds/distribution');
const node = require('./distribution/local/node.js');

node.start((err) => {
  if (err) {
    console.error('Error starting node:', err);
    process.exit(1);
  }
  console.log(`Node is running on ${node.config.ip}:${node.port}`);
});