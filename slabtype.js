var CONTAINER_CSS = [
    'position: relative',
    '-webkit-transform-origin: 50% 0',
    '-moz-transform-origin: 50% 0',
    '-o-transform-origin: 50% 0',
    '-ms-transform-origin: 50% 0',
    'transform-origin: 50% 0'
].join(';');

var LINE_CSS = [
    'position:absolute',
    'top: 0',
    'left: 0',
    'white-space: nowrap',
    '-webkit-transform-origin: 0 0',
    '-moz-transform-origin: 0 0',
    '-o-transform-origin: 0 0',
    '-ms-transform-origin: 0 0',
    'transform-origin: 0 0'
].join(';');

function setVendorStyle(el, rule, value) {
    el.style['-webkit-' + rule] = value;
    el.style['-moz-' + rule] = value;
    el.style['-o-' + rule] = value;
    el.style['-ms-' + rule] = value;
    el.style[rule] = value;
}

function makeLines(text, targetLineLength) {
    // Use Erik Loyer's slabtype algorithm to split our input text into
    // suitable lines. We depart from the original algorithm by requiring the
    // ideal line length to be given instead of automagically calculated.
    //
    // http://erikloyer.com/index.php/blog/the_slabtype_algorithm_part_1_background/
    var words = text.split(/\s+/);

    var lines = [];
    var preText, postText, lineText;
    var preDiff, postDiff;
    var wordIndex = 0;

    while (wordIndex < words.length) {
        postText = '';
        while (postText.length < targetLineLength) {
            preText = postText;
            postText += words[wordIndex] + ' ';
            wordIndex++;
            if (wordIndex >= words.length) {
                break;
            }
        }

        preText = preText.trim();
        postText = postText.trim();
        preDiff = targetLineLength - preText.length;
        postDiff = postText.length - targetLineLength;

        if (preText && preDiff < postDiff) {
            lineText = preText;
            wordIndex--;
        } else {
            lineText = postText;
        }
        lines.push(lineText);
    }

    console.log('slabtype lines:', lines);
    return lines;
}

function layout(el, targetLineLength, width, height) {
    if (width === undefined) {
        width = el.clientWidth;
    }
    if (height === undefined) {
        height = el.clientHeight;
    }

    var text = el.innerText || el.textContent;
    var lines = makeLines(text, targetLineLength);

    // Add our lines to the DOM, where each line is wrapped in a <span> and all
    // of the spans are wrapped in a <div>.
    var spans = [];
    var line;
    for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        spans.push(
            '<span style="' + LINE_CSS + '">' +
            line +
            '</span>'
        );
    }
    el.innerHTML = (
        '<div class="slabtext" style="' + CONTAINER_CSS + '">' +
        spans.join('\n') +
        '</div>'
    );

    // Lay out the lines optimally within the given bounds.
    var lineEls = el.querySelectorAll('span');
    var lineCount = lineEls.length;
    var lineEl;
    var scale;
    var rect;
    var totalHeight = 0;
    for (i = 0; i < lineCount; i++) {
        lineEl = lineEls[i];
        scale = width / lineEl.offsetWidth;
        if (scale !== 1) {
            setVendorStyle(lineEl, 'transform', 'scale(' + scale + ',' + scale + ')');
            lineEl.style['top'] = totalHeight + 'px';
            rect = lineEl.getBoundingClientRect();
            totalHeight += rect.height;
        }
    }

    var wrapper = el.querySelector('.slabtext');
    var containerScale = 1;
    if (totalHeight <= height) {
        // Our text fits, so center it vertically
        var offset = (height - totalHeight) / 2;
        setVendorStyle(wrapper, 'transform', 'translateY(' + offset + 'px)');
    } else {
        // Our text is too tall, so scale the whole container down and center
        // it horizontally.
        containerScale = height / totalHeight;
        setVendorStyle(wrapper, 'transform',
            'scale(' + containerScale + ',' + containerScale + ')');
    }

    return {
        'slabHeight': totalHeight * containerScale,
        'containerHeight': height,
        'containerWidth': width,
        'scale': containerScale
    };
}

function parseFontSize(computedStyle) {
    return parseInt(/(\d+)px/.exec(computedStyle['font-size'])[1], 10);
}

function getCanvasFont(computedStyle) {
    return [
        computedStyle['font-style'],
        computedStyle['font-weight'],
        computedStyle['font-size'],
        computedStyle['font-family']
    ].join(' ');
}

function layoutCanvas(el, targetLineLength, width, height) {
    if (width === undefined) {
        width = el.clientWidth;
    }
    if (height === undefined) {
        height = el.clientHeight;
    }

    var text = el.innerText || el.textContent;
    var lines = makeLines(text.toUpperCase(), targetLineLength);

    var computedStyle = window.getComputedStyle(el, null);
    var fontSize = parseFontSize(computedStyle);
    var ctx = el.getContext('2d');

    ctx.font = getCanvasFont(computedStyle);
    ctx.fillStyle = computedStyle['color'];
    ctx.textBaseline = 'hanging';

    // It takes two passes through the array of lines to figure out how to draw
    // them to the canvas. On the first pass, we pre-calculate each line's size
    // and scaling factors and accumulate a total height for all of the lines.
    var line, lineWidth, lineScale;
    var lineSpecs = [];
    var slabHeight = 0;
    for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        lineWidth = ctx.measureText(line).width;
        lineScale = width / lineWidth;
        lineSpecs.push({
            'text': line,
            'scale': lineScale
        });
        slabHeight += fontSize * lineScale;
    }

    // Then we use the pre-calculated height of the whole slab to figure out
    // whether we need to center it vertically or scale the whole thing down to
    // fit inside the container.
    ctx.save();
    var slabScale = 1;
    if (slabHeight <= height) {
        var offset = (height - slabHeight) / 2;
        ctx.translate(0, offset);
    } else {
        slabScale = height / slabHeight;
        ctx.scale(slabScale, slabScale);
    }

    // And finally we can make our second pass through the lines to draw them
    // to the canvas.
    var lineSpec;
    var lineOffset = 0;
    for (i = 0; i < lineSpecs.length; i++) {
        lineSpec = lineSpecs[i];
        ctx.save();
        ctx.translate(0, lineOffset);
        ctx.scale(lineSpec['scale'], lineSpec['scale']);
        ctx.fillText(lineSpec['text'], 0, 0);
        ctx.restore();
        lineOffset += fontSize * lineScale;
    }
    ctx.restore();

    return {
        'slabHeight': slabHeight * slabScale,
        'containerHeight': height,
        'containerWidth': width,
        'scale': slabScale
    };
}

var Slabtype = {
    'layout': layout,
    'layoutCanvas': layoutCanvas
};

Slabtype = Slabtype;
