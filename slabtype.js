(function(globals) {

function makeLines(text, targetLineLength) {
    // Use Erik Loyer's slabtype algorithm to split our input text into
    // suitable lines. We depart from the original algorithm by requiring the
    // ideal line length to be given instead of automagically calculated.
    //
    // http://erikloyer.com/index.php/blog/the_slabtype_algorithm_part_1_background/
    var words = text.trim().split(/\s+/);

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
    return lines;
}

function getLineHeight(computedStyle) {
    return parseFloat(computedStyle.getPropertyValue('line-height'));
}

function getCanvasFont(computedStyle) {
    return [
        computedStyle.getPropertyValue('font-style'),
        computedStyle.getPropertyValue('font-weight'),
        computedStyle.getPropertyValue('font-size'),
        computedStyle.getPropertyValue('font-family')
    ].join(' ');
}

function prepareContextShadow(ctx, computedStyle) {
    var textShadow = computedStyle.getPropertyValue('text-shadow');
    var matches = /^(.+?) (-?\d+)px (-?\d+)px (\d+)px$/.exec(textShadow);
    if (!matches) {
        return ctx;
    }
    ctx.shadowColor = matches[1];
    ctx.shadowOffsetX = parseInt(matches[2], 10);
    ctx.shadowOffsetY = parseInt(matches[3], 10);
    ctx.shadowBlur = parseInt(matches[4], 10);
    return ctx;
}

function prepareCanvas(canvasEl, width, height) {
    // Need to account for HiDPI (ie, Retina) displays:
    // http://www.html5rocks.com/en/tutorials/canvas/hidpi/
    var ctx = canvasEl.getContext('2d');
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                            ctx.mozBackingStorePixelRatio ||
                            ctx.msBackingStorePixelRatio ||
                            ctx.oBackingStorePixelRatio ||
                            ctx.backingStorePixelRatio || 1;
    var ratio = devicePixelRatio / backingStoreRatio;
    canvasEl.width = width * ratio;
    canvasEl.height = height * ratio;
    ctx.scale(ratio, ratio);
    return canvasEl;
}

function prepareContext(canvasEl, computedStyle) {
    var ctx = canvasEl.getContext('2d');
    ctx.font = getCanvasFont(computedStyle);
    ctx.fillStyle = computedStyle.getPropertyValue('color');
    ctx.testAlign = 'center';
    ctx.textBaseline = 'middle';
    return prepareContextShadow(ctx, computedStyle);
}

function layout(el, targetLineLength, width, height) {
    if (width === undefined) {
        width = el.clientWidth;
    }
    if (height === undefined) {
        height = el.clientHeight;
    }

    // What text are we laying out?
    var text = el.innerText || el.textContent;

    // If the input element's not a canvas, we'll replace it with one.
    var canvasEl = el.nodeName.toLowerCase() === 'canvas' ? el : document.createElement('canvas');
    prepareCanvas(canvasEl, width, height);

    // Get everything we need from the computed style of the input element
    // BEFORE we replace it with our canvas, otherwise the computed styles will
    // change.
    var computedStyle = window.getComputedStyle(el, null);
    var ctx = prepareContext(canvasEl, computedStyle);
    var lineHeight = getLineHeight(computedStyle);

    if (canvasEl !== el) {
        canvasEl.style['height'] = height + 'px';
        canvasEl.style['width'] = width + 'px';
        el.parentNode.replaceChild(canvasEl, el);
        el = null;
    }

    // Figure any padding we need based on the text shadow settings of our ctx.
    var shadowBlur = ctx.shadowBlur;
    var paddingLeft = shadowBlur - ctx.shadowOffsetX;
    var paddingRight = shadowBlur + ctx.shadowOffsetX;
    var paddingTop = shadowBlur - ctx.shadowOffsetY;
    var paddingBottom = shadowBlur + ctx.shadowOffsetY;
    var availableWidth = width - paddingLeft - paddingRight;

    // It takes two passes through the array of lines to figure out how to draw
    // them to the canvas. On the first pass, we pre-calculate each line's size
    // and scaling factors and accumulate a total height for all of the lines.
    var lines = makeLines(text.toUpperCase(), targetLineLength);
    var line, lineWidth, lineScale;
    var scales = [];
    var slabHeight = paddingTop + paddingBottom;
    for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        lineWidth = ctx.measureText(line).width;
        lineScale = availableWidth / lineWidth;
        scales.push(lineScale);
        slabHeight += lineHeight * lineScale;
    }

    // Then we use the pre-calculated height of the whole slab to figure out
    // whether we need to center it vertically or scale the whole thing down to
    // fit inside the container.
    //
    // We translate/scale the context here without restoring, because this gets
    // the canvas into the right position for the actual rendering pass.
    var slabScale = 1;
    if (slabHeight <= height) {
        var offsetY = (height - slabHeight) / 2;
        ctx.translate(paddingLeft, offsetY);
    } else {
        slabScale = height / slabHeight;
        var offsetX = (width - (width * slabScale)) / (2 * slabScale);
        ctx.scale(slabScale, slabScale);
        ctx.translate(offsetX + paddingLeft, paddingTop);
    }

    // And finally we can make our second pass through the lines to draw them
    // to the canvas.
    var lineOffset;
    var fontOffset = lineHeight / 2;
    for (i = 0; i < lines.length; i++) {
        line = lines[i];
        lineScale = scales[i];

        ctx.save();
        ctx.scale(lineScale, lineScale);
        ctx.fillText(line, 0, fontOffset);
        ctx.restore();

        // translate the context so that it's ready for the next line to be
        // drawn.
        lineOffset = lineHeight * lineScale;
        ctx.translate(0, lineOffset);
    }

    return {
        'slabHeight': slabHeight * slabScale,
        'containerHeight': height,
        'containerWidth': width,
        'scale': slabScale
    };
}

globals['Slabtype'] = {
    'layout': layout
};

})(window);
