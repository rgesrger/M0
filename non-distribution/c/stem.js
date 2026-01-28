#!/usr/bin/env node

/*
Convert each term to its stem
Usage: input > ./stem.js > output
*/

const readline = require('readline');
const natural = require('natural');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', function(line) {
  // console.log('line', line);
  const stemmer = natural.PorterStemmer;
  const stem = stemmer.stem(line);
  console.log(stem);
  // Print the Porter stem from `natural` for each element of the stream.
});
