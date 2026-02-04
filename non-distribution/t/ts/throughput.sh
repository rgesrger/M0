#!/bin/bash
URL="https://cs.brown.edu/courses/csci1380/sandbox/1/index.html"
mkdir -p d

# crawler test
start=$(date +%s.%N)
for _ in {1..5}; do 
    ./crawl.sh "$URL" > d/temp_content.txt 
done
end=$(date +%s.%N)

echo "Crawler Latency: $(echo "scale=4; ($end - $start) / 5" | bc) seconds/url"

start=$(date +%s.%N)
for _ in {1..5}; do 
    ./index.sh d/temp_content.txt "$URL" 
done
end=$(date +%s.%N)
echo "Indexer Latency: $(echo "scale=4; ($end - $start) / 5" | bc) seconds/page"