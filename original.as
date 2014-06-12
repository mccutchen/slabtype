/* -- formatInscription : formats the text to fit the slab dimensions -- */
public function formatInscription(rect:Rectangle, useMargin:Boolean):Void {

    // calculate height of the ’ideal’ line
    var idealLineAspectRatio:Number = PS.fontInfo.altGoth3D.aspectRatio * PS.fontInfo.altGoth3D.idealLineLength;
    var idealLineWidth:Number = rect.width;
    var idealLineHeight:Number = idealLineWidth / idealLineAspectRatio;
    var lineCount:Number = Math.floor(rect.height / idealLineHeight);
    var idealCharPerLine:Number = Math.min(60, Math.max(Math.round(this._inscription.length / lineCount), 1));


    // segment the text into lines
    var words:Array = this._inscription.split(“ ”);
    var lineBreaks:Array = new Array();
    var preText,postText,finalText:String;
    var preDiff,postDiff:Number;
    var wordIndex:Number = 0;
    var lineText:Array = new Array();


    var counter:Number = 0;

    // while we still have words left, build the next line
    while (wordIndex < words.length) {
        postText = “”;

        // build two strings (preText and postText) word by word, with one
        // string always one word behind the other, until
        // the length of one string is less than the ideal number of characters
        // per line, while the length of the other is greater than that ideal
        while (postText.length < idealCharPerLine) {
            preText = postText;
            postText += words[wordIndex]+“ ”;
            wordIndex++;
            if (wordIndex >= words.length) {
                break;
            }
        }

        // calculate the character difference between the two strings and the
        // ideal number of characters per line
        preDiff = idealCharPerLine - preText.length;
        postDiff = postText.length - idealCharPerLine;

        // if the smaller string is closer to the length of the ideal than
        // the longer string, and doesn’t contain just a single space, then
        // use that one for the line
        if ((preDiff < postDiff) && (preText.length > 2)) {
            finalText = preText;
            wordIndex--;

        // otherwise, use the longer string for the line
        } else {
            finalText = postText;
        }

        lineText.push(finalText.substr(0, finalText.length-1));
    }

    lineCount = lineText.length;

    // create inscription clip
    this._inscriptionClip.removeMovieClip();
    this.createEmptyMovieClip(“inscriptionClip”, 10);
    this._inscriptionClip = this[“inscriptionClip”];

    // build the text fields
    var curY:Number = 0;
    this._lines = new Array();
    for (var i:Number=0; i<lineCount; i++) {
        this._inscriptionClip.attachMovie(“altGoth3DText”, “line”+i, 10+i);
        this._lines.push(this._inscriptionClip[“line”+i]);
        this._lines[i].content.text = lineText[i];

        // scale this line so it exactly fits with width of the rect
        this._lines[i]._yscale = this._lines[i]._xscale = (rect.width / this._lines[i].content.textWidth) * 100;

        this._lines[i]._y = curY;
        curY += this._lines[i]._height * .59;
    }

    this._inscriptionWidth = rect.width;
    this._inscriptionHeight = curY;
    this._inscriptionAR = this._inscriptionWidth / this._inscriptionHeight;

    if (useMargin) {
        var margin:Number = this._margin;
    } else {
        var margin:Number = 0;
    }

    // calculate the scaling to apply so the total inscription fits inside the rect
    // centered, with the given margin
    var clipScale:Number;
    clipScale = ((rect.width-(margin * 2)) / rect.width) * 100;
    if (this._inscriptionHeight > rect.height) {
        clipScale = ((rect.height-(margin * 2)) / this._inscriptionHeight) * 100;
    }
    this._inscriptionClip._yscale = this._inscriptionClip._xscale = clipScale;
    this._inscriptionClip._x = (rect.width - (rect.width * (clipScale / 100))) / 2;
    this._inscriptionClip._y = (rect.height - (this._inscriptionHeight * (clipScale / 100))) / 2;
    GraphicUtil.changeColor(this._inscriptionClip, this._colorScheme.text_color);

}
