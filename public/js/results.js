Results.prototype = Object.create(Screen.prototype);

function Results(onDoneViewingResults) {
	Screen.call(this);

	this.onDoneViewingResults = onDoneViewingResults;

	this.id = "#result";
}

Results.prototype.initialize = function() {
	var self = this;
	$("#result-done").on("click", function() {
		self.onDoneViewingResults();
	});
};

Results.prototype.show = function(res, isArchivePage) {
	socket.off("disconnect");

	var chains = res.data.chains;
	var ourChain;
	for (var i = 0; i < chains.length; i++) {
		var chain = chains[i];
		if (chain.owner.id === res.you.id) {
			ourChain = chain;
			break;
		}
	}

	//if we don't own a chain, just show the first one
	if (ourChain) {
		this.render(ourChain, chains);
	} else {
		this.render(chains[0], chains);
	}

	Screen.prototype.show.call(this);

	if (!isArchivePage && !res.data.isViewPreviousResults) {
		addResultsToStorage(chains);
	}
};

Results.prototype.render = function(chainToShow, allChains) {
	Screen.prototype.setTitle.call(
		this,
		chainToShow.owner.name + "'s Drawphone results"
	);
	var subtitle =
		"Now, take turns holding up your phones where everyone can see, and reading off your results to the group.";
	Screen.prototype.setSubtitle.call(this, subtitle);
	this.displayChain(chainToShow);
	this.displayOtherChainButtons(allChains, chainToShow);
};

Results.prototype.displayChain = function(chain) {
	var results = $("#result-content");
	results.empty();

	for (var i = 0; i < chain.links.length; i++) {
		var link = chain.links[i];
		if (i === 0 && link.type === WORD) {
			results.append(
				"<h3>The first word:</h3><h1>" + link.data + "</h1>"
			);
		} else if (i === 1 && chain.links[0].type === FIRST_WORD) {
			results.append(
				"<h3>" +
					link.player.name +
					" wanted someone to draw:</h3><h1>" +
					link.data +
					"</h1>"
			);
		} else if (link.type === DRAWING) {
			results.append(
				"<h3>" +
					link.player.name +
					' drew:</h3><img class="drawing" src="' +
					link.data +
					'"></img>'
			);
		} else if (link.type === WORD) {
			results.append(
				"<h3>" +
					link.player.name +
					" thought that was:</h3><h1>" +
					link.data +
					"</h1>"
			);
		}
	}

	var wentFromBox = "";
	wentFromBox += '<br><div class="well">';
	var firstIndex = chain.links[0].type === FIRST_WORD ? 1 : 0;
	wentFromBox +=
		"<h4>You started with:</h4><h2>" +
		chain.links[firstIndex].data +
		"</h2><br>";
	wentFromBox +=
		"<h4>and ended up with:</h4><h2>" +
		chain.links[chain.links.length - 1].data +
		"</h2>";
	wentFromBox += "</div>";
	results.append(wentFromBox);
};

Results.prototype.displayOtherChainButtons = function(
	chainsToList,
	chainToIgnore
) {
	var others = $("#result-others");
	others.empty();

	if (chainsToList.length > 1) {
		others.append("<h4>View more results:</h4>");
	}

	var self = this;
	for (var i = 0; i < chainsToList.length; i++) {
		var chain = chainsToList[i];

		//only make a button for the chain if it is not the one we are now displaying
		if (chain.id !== chainToIgnore.id) {
			var button = $(
				'<button type="button">' +
					chain.owner.name +
					"'s results</button>"
			);
			button.addClass("btn btn-default btn-lg");
			(function(thisChain, chainList) {
				button.click(function() {
					self.render(thisChain, chainList);

					//jump to top of the page
					window.scrollTo(0, 0);
				});
			})(chain, chainsToList);
			others.append(button);
		}
	}
};
