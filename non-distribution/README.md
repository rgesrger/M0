# non-distribution

This milestone aims (among others) to refresh (and confirm) everyone's
background on developing systems in the languages and libraries used in this
course.

By the end of this assignment you will be familiar with the basics of
JavaScript, shell scripting, stream processing, Docker containers, deployment
to AWS, and performance characterization—all of which will be useful for the
rest of the project.

Your task is to implement a simple search engine that crawls a set of web
pages, indexes them, and allows users to query the index. All the components
will run on a single machine.

## Getting Started

To get started with this milestone, run `npm install` inside this folder. To
execute the (initially unimplemented) crawler run `./engine.sh`. Use
`./query.js` to query the produced index. To run tests, do `npm run test`.
Initially, these will fail.

### Overview

The code inside `non-distribution` is organized as follows:

```
.
├── c            # The components of your search engine
├── d            # Data files like seed urls and the produced index
├── s            # Utility scripts for linting your solutions
├── t            # Tests for your search engine
├── README.md    # This file
├── crawl.sh     # The crawler
├── index.sh     # The indexer
├── engine.sh    # The orchestrator script that runs the crawler and the indexer
├── package.json # The npm package file that holds information like JavaScript dependencies
└── query.js     # The script you can use to query the produced global index
```

### Submitting

To submit your solution, run `./scripts/submit.sh` from the root of the stencil. This will create a
`submission.zip` file which you can upload to the autograder.

## Summary
This is an implementation of a crawler, which at a high level uses an engine.sh script that runs the cralwer and indexer. The crawler calls getURL.js and getText.js, where getURL.js extracts all of the URLs from a given web page, and getText gets the text from html.

After we get the URLs we process the text in process.sh, which cleans the input by making
sure we only have lowercase characters, have characters in ASCII, etc. We then stem the words
which makes use of Porter Stemmer. We then merge the output by creating a dictionary for the global term, and corresponding frequencies in URLs and merging the local dictionary with 
the global one. After that, we add them all into a global index.

The query step involves returning lines from the global index that include the term we are querying (the term we are querying also gets processed and stemmed).

The most challenging aspect was figuring out how to write tests and run them.

To characterize correctness, we developed tests that:
1. Checked for how merge.js worked with empty files
2. Checked if getURLs could get the correct URLs and ignore broken ones (2 tests for this)
3. Tested proper nouns for stem
4. Tested to see if all stopping words provided correct output for process
5. Tested to see if query worked if the word did not appear
6. Tested to see if query worked if there were only stopwords
7. Tested to see if merge worked if there was only 1 file
