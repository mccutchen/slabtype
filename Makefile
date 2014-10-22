PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

dist/slabtype.js: src/*.js
	mkdir -p dist
	browserify src/slabtype.js -o dist/slabtype.js -s Slabtype
