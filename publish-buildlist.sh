#!/bin/bash

CD=cd
CP="cp -R"
RM="rm -rf"
GIT=git
TEMP_DIR=/tmp
DOC_DIR=documentation
DL_DIR=download

$RM $TEMP_DIR/weaver
$GIT clone -b gh-pages https://github.com/maxkfranz/weaver.git $TEMP_DIR/weaver
$CP $DOC_DIR/$DL_DIR/* $TEMP_DIR/weaver/$DL_DIR
$CD $TEMP_DIR/weaver
$GIT add -A
$GIT commit -a -m "updating list of builds"
$GIT push origin