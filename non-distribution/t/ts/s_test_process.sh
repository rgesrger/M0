#!/bin/bash
# This is a student test
T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

DIFF=${DIFF:-diff}


if $DIFF <(cat "$T_FOLDER"/d/c3.txt | c/process.sh | sort) <(sort "$T_FOLDER"/d/c31.txt) >&2;
then
    echo "$0 success: texts are identical"
    exit 0
else
    echo "$0 failure: texts are not identical"
    exit 1
fi
