#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

cat /dev/null > d/global-index.txt

files=("$T_FOLDER"/d/n{1..3}.txt)

for file in "${files[@]}"
do
    cat "$file" | c/merge.js d/global-index.txt > d/temp-global-index.txt
    mv d/temp-global-index.txt d/global-index.txt
done

if DIFF_PERCENT=$DIFF_PERCENT t/gi-diff.js <(sort d/global-index.txt) <(sort "$T_FOLDER"/d/n4.txt) >&2;
then
    echo "$0 success"
    exit 0
else
    echo "$0 failure"
    exit 1
fi

files=("$T_FOLDER"/d/n1.txt)

for file in "${files[@]}"
do
    cat "$file" | c/merge.js d/global-index.txt > d/temp-global-index.txt
    mv d/temp-global-index.txt d/global-index.txt
done

if DIFF_PERCENT=$DIFF_PERCENT t/gi-diff.js <(sort d/global-index.txt) <(sort "$T_FOLDER"/d/n4.txt) >&2;
then
    echo "$0 success"
    exit 0
else
    echo "$0 failure"
    exit 1
fi