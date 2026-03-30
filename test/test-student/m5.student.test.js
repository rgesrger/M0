/*
    In this file, add your own test cases that correspond to functionality introduced for each milestone.
    You should fill out each test case so it adequately tests the functionality you implemented.
    You are left to decide what the complexity of each test case should be, but trivial test cases that abuse this flexibility might be subject to deductions.

    Imporant: Do not modify any of the test headers (i.e., the test('header', ...) part). Doing so will result in grading penalties.
*/

const distribution = require('../../distribution.js')();
require('../helpers/sync-guard');
const id = distribution.util.id;

const testgroup1Group = {};
const avgwrdlGroup = {};
const cfreqGroup = {};
const fs = require('fs');
/*
  The local node will be the orchestrator.
*/

const n1 = {ip: '127.0.0.1', port: 7110};
const n2 = {ip: '127.0.0.1', port: 7111};
const n3 = {ip: '127.0.0.1', port: 7112};
test('(1 pts) student test', (done) => {

  const mapper = (key, value) => {
    const words = value.split(/\s+/).filter(Boolean);
    return words.map((w) => {
      const out = {};
      out[w.toLowerCase()] = 1;
      return out;
    });
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'doc1': 'apple banana apple'},
    {'doc2': 'banana orange cherry'},
    {'doc3': 'apple cherry cherry'},
  ];

  const expected = [
    {'apple': 3},
    {'banana': 2},
    {'orange': 1},
    {'cherry': 3}
  ];

  const keys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.cfreq.mr.exec({keys: keys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(expect.arrayContaining(expected));
        expect(v).toHaveLength(expected.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.cfreq.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  // much longer cfreq test with only 1 key
  const mapper = (key, value) => {
    const chars = value.replace(/\s+/g, '').split('');
    const out = [];
    chars.forEach((char) => {
      const o = {};
      o[char] = 1;
      out.push(o);
    });
    return out;
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((sum, v) => sum + v, 0);
    return out;
  };

  const dataset = [
    {'doc1': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
    {'doc2': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
    {'doc3': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'},
  ];

  const expected = [{'a': 468}];

  const doMapReduce = () => {
    distribution.cfreq.mr.exec({keys: getDatasetKeys(dataset), map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(v).toEqual(expect.arrayContaining(expected));
        expect(v).toHaveLength(expected.length);
        done();
      } catch (e) {
        done(e);
      }
    });
  };

  let cntr = 0;

  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.cfreq.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) {
        doMapReduce();
      }
    });
  });
});


test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    if (value === 'the' || value === 'and') {
      return []; 
    }

    return [
      {[value]: 1},
      {'lettercount': value.length}
    ];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + b, 0);
    return out;
  };

  const dataset = [
    {'k1': 'apple'},
    {'k2': 'the'},
    {'k3': 'and'},
    {'k4': 'banana'}
  ];

  const expected = [
    {'apple': 1},
    {'banana': 1},
    {'lettercount': 11} 
  ];

  const keys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.testgroup1.mr.exec({keys: keys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(expect.arrayContaining(expected));
        expect(v).toHaveLength(expected.length);
        done();
      } catch (error) {
        done(error);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.testgroup1.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) doMapReduce();
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    // Every single input has same key
    return [{'collision': [value]}];
  };

  const reducer = (key, values) => {
    const out = {};
    out[key] = values.reduce((a, b) => a + parseInt(b, 10), 0);
    return out;
  };

  const dataset = [
    {'doc1': 10},
    {'doc2': 20},
    {'doc3': 30},
    {'doc4': 40},
    {'doc5': 50},
  ];

  const expected = [
    {'collision': 150} 
  ];

  const keys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.testgroup1.mr.exec({keys: keys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(expect.arrayContaining(expected));
        expect(v).toHaveLength(1); 
        done();
      } catch (error) {
        done(error);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.testgroup1.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) doMapReduce();
    });
  });
});

test('(1 pts) student test', (done) => {
  const mapper = (key, value) => {
    return []; 
  };

  // The reducer should not be called
  const reducer = (key, values) => {
    return { [key]: 'this should not happen' };
  };

  const dataset = [
    {'doc1': 'ignore this'},
    {'doc2': 'and ignore this'},
    {'doc3': 'doesnt matter what is here'},
  ];

  const expected = [];

  const keys = dataset.map((o) => Object.keys(o)[0]);

  const doMapReduce = () => {
    distribution.testgroup1.mr.exec({keys: keys, map: mapper, reduce: reducer}, (e, v) => {
      try {
        expect(e).toBeFalsy();
        expect(v).toEqual(expected);
        expect(v).toHaveLength(0);
        done();
      } catch (error) {
        done(error);
      }
    });
  };

  let cntr = 0;
  dataset.forEach((o) => {
    const key = Object.keys(o)[0];
    const value = o[key];
    distribution.testgroup1.store.put(value, key, (e, v) => {
      cntr++;
      if (cntr === dataset.length) doMapReduce();
    });
  });
});
function getDatasetKeys(dataset) {
  return dataset.map((o) => Object.keys(o)[0]);
}

beforeAll((done) => {
  try {
    testgroup1Group[id.getSID(n1)] = n1;
    testgroup1Group[id.getSID(n2)] = n2;
    testgroup1Group[id.getSID(n3)] = n3;

    avgwrdlGroup[id.getSID(n1)] = n1;
    avgwrdlGroup[id.getSID(n2)] = n2;
    avgwrdlGroup[id.getSID(n3)] = n3;

    cfreqGroup[id.getSID(n1)] = n1;
    cfreqGroup[id.getSID(n2)] = n2;
    cfreqGroup[id.getSID(n3)] = n3;


    const startNodes = (cb) => {
      distribution.local.status.spawn(n1, (e, v) => {
        if (e) {
          done(e);
          return;
        }
        distribution.local.status.spawn(n2, (e, v) => {
          if (e) {
            done(e);
            return;
          }
          distribution.local.status.spawn(n3, (e, v) => {
            if (e) {
              done(e);
              return;
            }
            cb();
          });
        });
      });
    };

    distribution.node.start((e) => {
      if (e) {
        done(e);
        return;
      }
      const testgroup1Config = {gid: 'testgroup1'};
      startNodes(() => {
        distribution.local.groups.put(testgroup1Config, testgroup1Group, (e, v) => {
          distribution.testgroup1.groups.put(testgroup1Config, testgroup1Group, (e, v) => {
            const avgwrdlConfig = {gid: 'avgwrdl'};
            distribution.local.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
              distribution.avgwrdl.groups.put(avgwrdlConfig, avgwrdlGroup, (e, v) => {
                const cfreqConfig = {gid: 'cfreq'};
                distribution.local.groups.put(cfreqConfig, cfreqGroup, (e, v) => {
                  distribution.cfreq.groups.put(cfreqConfig, cfreqGroup, (e, v) => {
                    done();
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (e) {
    done(e);
  }
});

afterAll((done) => {
  const remote = {service: 'status', method: 'stop'};
  remote.node = n1;
  distribution.local.comm.send([], remote, (e, v) => {
    remote.node = n2;
    distribution.local.comm.send([], remote, (e, v) => {
      remote.node = n3;
      distribution.local.comm.send([], remote, (e, v) => {
        if (globalThis.distribution.node.server) {
          globalThis.distribution.node.server.close();
        }
        done();
      });
    });
  });
});
