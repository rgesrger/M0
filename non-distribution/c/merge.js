#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: input > ./merge.js global-index > output

*/

const fs = require('fs');
const readline = require('readline');
// The `compare` function can be used for sorting.
const compare = (a, b) => {
  if (a.freq > b.freq) {
    return -1;
  } else if (a.freq < b.freq) {
    return 1;
  } else {
    return 0;
  }
};
const rl = readline.createInterface({
  input: process.stdin,
});

// 1. Read the incoming local index data from standard input (stdin) line by line.

const lines = [];
let localIndex = '';
rl.on('line', (line) => {
  lines.push(line);
});

rl.on('close', () => {
  localIndex = lines.join('\n');
  const globalIndexPath = process.argv[2];
  // console.error('globalIndexPath', globalIndexPath);
  if (fs.existsSync(globalIndexPath)) {
    fs.readFile(globalIndexPath, 'utf8', printMerged);
  }
  // 2. Read the global index name/location, using process.argv
  // and call printMerged as a callback
});


const printMerged = (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');

  const local = {};
  const global = {};

  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object
  // where keys are terms and values store a url->freq map (one entry per url).
  for (const line of localIndexLines) {
    if (!line.trim()) continue;
    const [term, rawfreq, url] = line.split('|').map((p) => p.trim());
    const freq = parseInt(rawfreq);
    if (!(term in local)) {
      local[term] = {};
      local[term][url] = freq;
    } else {
      if (url in local[term]) {
        local[term][url] +=freq;
      } else {
        local[term][url] = freq;
      }
    }
  }

  // 4. For each line in `globalIndexLines`, parse them and add them to the `global` object
  // where keys are terms and values are url->freq maps (one entry per url).
  // Use the .trim() method to remove leading and trailing whitespace from a string.
  for (const line of globalIndexLines) {
    if (!line.trim()) continue;
    const splits = line.split('|').map((p) => p.trim());
    if (splits.length !== 2) continue;
    const [term, counts] = splits;
    const parts = counts.split(' ');
    const grouped = {};
    for (let i=0; i<parts.length; i+=2) {
      const url = parts[i];
      const freq = parseInt(parts[i+1], 10);
      grouped[url] = freq;
    }
    global[term] = grouped;
  }

  for (const term in local) {
    const localURLs = local[term];
    if (!(term in global)) {
      global[term] = {...localURLs};
    } else {
      const globalURLs = global[term];
      for (const url in localURLs) {
        if (url in globalURLs) {
          globalURLs[url] += localURLs[url];
        } else {
          globalURLs[url] = localURLs[url];
        }
      }
    }
  }

  const mergedLines = Object.keys(global).sort().map((term) => {
    const urlFreqPairs = [];
    for (const url in global[term]) {
      urlFreqPairs.push({'url': url, 'freq': global[term][url]});
    }
    urlFreqPairs.sort(compare);
    const st = urlFreqPairs.map((e) => `${e.url} ${e.freq}`).join(' ');
    // console.error('pairs', urlFreqPairs);
    return `${term} | ${st}`;
  });

  console.log(mergedLines.join('\n'));
};
