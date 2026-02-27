#!/bin/bash

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

DIFF=${DIFF:-diff}

term="bus"

cat "$T_FOLDER"/d/c7.txt > d/global-index.txt

if $DIFF <(./query.js "$term") <(cat "$T_FOLDER"/d/c8.txt) >&2;
then
    echo "$0 success"
    exit 0
else
    echo "$0 failure"
    exit 1
fi

term="and"

cat "$T_FOLDER"/d/c7.txt > d/global-index.txt


if $DIFF <(./query.js "$term") <(cat "$T_FOLDER"/d/c8.txt) >&2;
then
    echo "$0 success 2"
    exit 0
else
    echo "$0 failure 2"
    exit 1
fi




