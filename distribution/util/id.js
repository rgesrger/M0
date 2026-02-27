// @ts-check
/**
 * @typedef {import("../types.js").Node} Node
 * @typedef {import("../types.js").ID} ID
 * @typedef {import("../types.js").NID} NID
 * @typedef {import("../types.js").SID} SID
 * @typedef {import("../types.js").Hasher} Hasher
 */

const assert = require('assert');
const crypto = require('crypto');

/**
 * @param {any} obj
 * @returns {ID}
 */
function getID(obj) {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(obj));
  return hash.digest('hex');
}

/**
 * The NID is the SHA256 hash of the JSON representation of the node
 * @param {Node} node
 * @returns {NID}
 */
function getNID(node) {
  node = {ip: node.ip, port: node.port};
  return getID(node);
}

/**
 * The SID is the first 5 characters of the NID
 * @param {Node} node
 * @returns {SID}
 */
function getSID(node) {
  return getNID(node).substring(0, 5);
}

/**
 * @param {any} message
 * @returns {string}
 */
function getMID(message) {
  const msg = {};
  msg.date = new Date().getTime();
  msg.mss = message;
  return getID(msg);
}

/**
 * @param {string} id
 * @returns {bigint}
 */
function idToNum(id) {
  assert(typeof id === 'string', 'idToNum: id is not in KID form!');
  const trimmed = id.startsWith('0x') ? id.slice(2) : id;
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return BigInt(`0x${trimmed}`);
  }
  return BigInt(id);
}

/** @type { Hasher } */
const naiveHash = (kid, nids) => {
  const sortedNids = [...nids].sort();
  const index = Number(idToNum(kid) % BigInt(sortedNids.length));
  return sortedNids[index];
};

/** @type { Hasher } */
const consistentHash = (kid, nids) => {
  const numkid = BigInt("0x"+kid);
  const numnids = nids.map((nid)=> BigInt("0x"+nid));
  const sortedarr = [...numnids,numkid].sort((a, b) => (a<b? -1: a>b ?1: 0));
  const kidIndex = sortedarr.indexOf(numkid);
  const nextNum = sortedarr[(kidIndex + 1) % sortedarr.length];
  const originalIndex = numnids.indexOf(nextNum);
  return nids[originalIndex];
};

/** @type { Hasher } */
const rendezvousHash = (kid, nids) => {
  const concatnids = [...nids].map((nid) => kid+nid);
  const hashed = [...concatnids].map((elt) => getID(elt));
  const numhashed = [...hashed].map((elt)=> BigInt("0x"+elt)).sort((a, b) => (a<b? -1: a>b ?1: 0));
  const max = numhashed[numhashed.length - 1];
  const index = hashed.findIndex((elt) => BigInt("0x"+elt) === max);
  return nids[index];
};

module.exports = {
  getID,
  getNID,
  getSID,
  getMID,
  naiveHash,
  consistentHash,
  rendezvousHash,
};
