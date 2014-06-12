function layout(el, width, height, targetLineLength) {
    // First, use Erik Loyer's slabtype algorithm to split our input text into
    // suitable lines. We depart from the original algorithm by requiring the
    // ideal line length to be given instead of automagically calculated.
    //
    // http://erikloyer.com/index.php/blog/the_slabtype_algorithm_part_1_background/
    var text = el.innerText;
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

    // Add our lines to the DOM, where each line is wrapped in a <span> and all
    // of the spans are wrapped in a <div>.
    var spans = [];
    var line;
    for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        spans.push(
            '<span style="position:absolute; top: 0; left: 0; -webkit-transform-origin: 0 0; white-space: nowrap">' +
            line +
            '</span>'
        );
    }
    el.innerHTML = (
        '<div class="slabtext" style="position:relative; -webkit-transform-origin: 0 0;">' +
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
            lineEl.style['-webkit-transform'] = 'scale(' + scale + ',' + scale + ')';
            lineEl.style['top'] = totalHeight + 'px';
            rect = lineEl.getBoundingClientRect();
            totalHeight += rect.height;
        }
    }

    var wrapper = el.querySelector('.slabtext');
    var offset;
    if (totalHeight <= height) {
        // Our text fits, so center it vertically
        offset = (height - totalHeight) / 2;
        wrapper.style['-webkit-transform'] = 'translateY(' + offset + 'px)';
    } else {
        // Our text is too tall, so scale the whole container down and center
        // it horizontally.
        scale = height / totalHeight;
        offset = (width - (width * scale)) / 2;
        wrapper.style['-webkit-transform'] = 'scale(' + scale + ',' + scale + ')';
        wrapper.style['left'] = offset + 'px';
    }

    return totalHeight;
}

module.exports = {
    'layout': layout
};
