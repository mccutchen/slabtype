function getLineHeight(computedStyle) {
    // Some browsers (webkit) report the computed line height as "normal" if it
    // is not explicitly set in CSS, so we have to guess at the actual line
    // height based on font size and an inaccurate approximation.
    //
    // More info:
    // https://developer.mozilla.org/en-US/docs/Web/CSS/line-height
    // http://meyerweb.com/eric/thoughts/2008/05/06/line-height-abnormal/
    // http://stackoverflow.com/questions/3614323/jquery-css-line-height-of-normal-px
    var lineHeight = parseFloat(computedStyle.getPropertyValue('line-height'));
    if (isNaN(lineHeight)) {
        var fontSize = parseFloat(computedStyle.getPropertyValue('font-size'));
        lineHeight = fontSize * 1.2;
    }
    return lineHeight;
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

function prepareCanvas(el, width, height) {
    var isCanvas = el.nodeName.toLowerCase() === 'canvas';
    var canvasEl = isCanvas ? el : document.createElement('canvas');

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

module.exports = {
    getLineHeight: getLineHeight,
    getCanvasFont: getCanvasFont,
    prepareCanvas: prepareCanvas,
    prepareContext: prepareContext,
    prepareContextShadow: prepareContextShadow
};
