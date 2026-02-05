// @ts-check

/**
 * @param {any} object
 * @returns {string}
 */
function serialize(object) {
  console.log('my serial')
  if (object === null ) {
    return '{"type":"null","value":""}';
  }
  const type = typeof object;
  switch (type) {
    case 'string':
      return `{"type":"string","value":${JSON.stringify(object)}}`;
    case 'number':
    case 'boolean':
      return `{"type":"${type}","value":"${object.toString()}"}`;
    case 'undefined':
      return `{"type":"undefined","value":null}`;
    case 'function':
      return `{"type":"Function","value":"${object.toString()}"}`;
    case 'object':
      const arr = [];
      let objtype = 'object';

      // handling for Errors
      if (object instanceof Error) {
        objtype = 'error';
        const errobj = {
          name: object.name,
          message: object.message,
          cause: object.cause,
        };
        const errserialized = serialize(errobj);
        return `{"type":"${objtype}","value":${errserialized}}`;
      }
      if (object instanceof Date) {
        return `{"type":"date","value":${JSON.stringify(object)}}`;
      }
      if (Array.isArray(object)) {
        objtype = 'array';
      }
      for (const key of Object.keys(object)) {
        const value = object[key];
        arr.push(`"${key}":`+serialize(value));
      }
      const serialized = `{"type":"${objtype}","value":{${arr.join(',')}}}`;
      return serialized;
  }
}


/**
 * @param {string} string
 * @returns {any}
 */
function deserialize(string) {
  if (typeof string !== 'string') {
    throw new Error(`Invalid argument type: ${typeof string}.`);
  }
  // console.log('deserializeq', JSON.parse(string));
  const parsed = JSON.parse(string);

  // check if in right format
  const {type, value} = parsed;
  switch (type) {
    case 'null':
      return null;

    case 'undefined':
      return undefined;

    case 'number':
      return Number(value);

    case 'boolean':
      return value === 'true';

    case 'string':
      return value;
    case 'Function':
      // console.log("JIJI", value, "original", string);
      return eval(`(${value})`);

    case 'object':
      const resultmap = {};
      for (const key of Object.keys(value)) {
        resultmap[key] =deserialize(JSON.stringify(value[key]));
      }
      return resultmap;
    case 'array':
      const arr = [];
      for (const key of Object.keys(value)) {
        arr[Number(key)] = deserialize(JSON.stringify(value[key]));
      }
      return arr;
    case 'error':
      const errobj = deserialize(JSON.stringify(value));
      const err= new Error(errobj.message);
      if ('cause' in errobj) {
        err.cause = errobj.cause;
      }
      err.name = errobj.name;
      return err;
    case 'date':
      return new Date(value);
  }
}

module.exports = {
  serialize,
  deserialize,
};
