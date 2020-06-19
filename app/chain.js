//
// Drawphone Chain
//

var FirstWordLink = require("./link/firstwordlink");

// A chain is the 'chain' of drawings and words.
// A link is the individual drawing or word in the chain.
function Chain(owner, id, timeLimit, wordChoices) {
	this.owner = owner;
	this.links = [];
	this.id = id;
	this.timeLimit = timeLimit;
	this.wordChoices = wordChoices;
	this.wordLen = 0;

	this.lastPlayerSentTo = owner.getJson();

	// if (!firstWord) {
	// console.log("First word 1", firstWord);
	this.addLink(new FirstWordLink(this.owner, this.wordChoices));
	// } else {
	//   console.log("First word 2", firstWord);
	//   this.addLink(new WordLink(this.owner, firstWord));
	// }
}

Chain.prototype.addLink = function(link) {
	this.links.push(link);
};

Chain.prototype.getLastLink = function() {
	return this.links[this.links.length - 1];
};

Chain.prototype.getLength = function() {
	if (this.links[0] && this.links[0].type === "first-word") {
		return this.links.length - 1;
	}
	return this.links.length;
};

//returns true if the player has a link in this chain already
Chain.prototype.playerHasLink = function(player) {
	for (var i = 0; i < this.links.length; i++) {
		if (this.links[i].player.id === player.id) {
			return true;
		}
	}
	return false;
};

Chain.prototype.sendLastLinkToThen = function(player, finalCount, next) {
	var count = this.getLength();
	if (this.links[0] && this.links[0].type === "first-word") {
		count++;
	} else {
		finalCount--;
	}
	//sends the link, then runs the second function
	//  when the 'finishedLink' event is received
	player.sendThen(
		"nextLink",
		{
			link: this.getLastLink(),
			chainId: this.id,
			count: count,
			finalCount: finalCount,
			timeLimit: this.timeLimit
		},
		"finishedLink",
		next
	);
};

Chain.prototype.getJson = function() {
	return {
		owner: this.owner.getJson(),
		links: this.links,
		id: this.id
	};
};

module.exports = Chain;
