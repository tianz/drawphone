//
// Drawphone DrawingLink
//

var Link = require("./link");

function DrawingLink(player, drawing, wordLen) {
	Link.call(this, player, drawing);
	this.type = "drawing";
	this.wordLen = wordLen;
}
DrawingLink.prototype = Object.create(Link.prototype);

module.exports = DrawingLink;
