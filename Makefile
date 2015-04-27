PATH  := node_modules/.bin:$(PATH)
SHELL := /bin/bash

# We pass the same args to browserify and watchify
build_args := src/slabtype.js -o dist/slabtype.js -s Slabtype

dist/slabtype.js: src/*.js
	mkdir -p dist
	browserify -t stripify $(build_args)

watch:
	mkdir -p dist
	watchify $(build_args) -v

js: npm dist/slabtype.js

clean:
	rm -r dist

all: js

.PHONY: all
