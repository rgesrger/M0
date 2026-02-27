#!/bin/bash
T_FOLDER=${T_FOLDER:-t}

DIFF=${DIFF:-diff}

if $DIFF <(cat "$T_FOLDER"/d/testgettext.txt | c/getText.js | sort) <(sort "$T_FOLDER"/d/d2.txt) >&2;
then
    echo "$0 failure: texts not identical"
    exit 0
else
    echo "$0 success: texts not identical"
    exit 1
fi
