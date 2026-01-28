#!/usr/bin/env node

/*
Merge the current inverted index (assuming the right structure) with the global index file
Usage: input > ./merge.js global-index > output

The inverted indices have the different structures!

Each line of a local index is formatted as:
  - `<word/ngram> | <frequency> | <url>`

Each line of a global index is be formatted as:
  - `<word/ngram> | <url_1> <frequency_1> <url_2> <frequency_2> ... <url_n> <frequency_n>`
  - Where pairs of `url` and `frequency` are in descending order of frequency
  - Everything after `|` is space-separated

-------------------------------------------------------------------------------------
Example:

local index:
  word1 word2 | 8 | url1
  word3 | 1 | url9
EXISTING global index:
  word1 word2 | url4 2
  word3 | url3 2

merge into the NEW global index:
  word1 word2 | url1 8 url4 2
  word3 | url3 2 url9 1

Remember to error gracefully, particularly when reading the global index file.
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
  // console.error('data', data);
  // Split the data into an array of lines
  const localIndexLines = localIndex.split('\n');
  const globalIndexLines = data.split('\n');

  // localIndexLines.pop();
  // globalIndexLines.pop();
  // console.error('local', localIndexLines, 'global', globalIndexLines);
  const local = {};
  const global = {};

  // 3. For each line in `localIndexLines`, parse them and add them to the `local` object
  // where keys are terms and values store a url->freq map (one entry per url).
  for (const line of localIndexLines) {
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
    // console.error('counts', counts, 'line', line);
    // console.log('counts', counts, 'line', line);
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

  // 5. Merge the local index into the global index:
  // - For each term in the local index, if the term exists in the global index:
  //     - Merge by url so there is at most one entry per url.
  //     - Sum frequencies for duplicate urls.
  // - If the term does not exist in the global index:
  //     - Add it as a new entry with the local index's data.
  // 6. Print the merged index to the console in the same format as the global index file:
  //    - Each line contains a term, followed by a pipe (`|`), followed by space-separated pairs of `url` and `freq`.
  //    - Terms should be printed in alphabetical order.
};
