//
// Drawphone FirstWordLink
//

var Link = require("./link");

function FirstWordLink(player, wordChoices) {
	Link.call(this, player, false);
	this.type = "first-word";
	this.wordChoices = wordChoices;
}
FirstWordLink.prototype = Object.create(Link.prototype);

module.exports = FirstWordLink;
