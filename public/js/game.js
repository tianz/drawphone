Game.prototype = Object.create(Screen.prototype);

function Game(onWait) {
	Screen.call(this);

	this.id = "#game";
	this.onWait = onWait;

	this.wordInput = $("#game-word-in");
	this.timerDisplay = $("#game-timer");

	this.canvas;

	this.submitTimer;

	window.addEventListener("resize", this.resizeCanvas.bind(this), false);
}

Game.prototype.initialize = function() {
	Screen.prototype.initialize.call(this);
	var doneButton = $("#game-send");

	//bind clear canvas to clear drawing button
	var self = this;

	//if user touches the canvas, it not blank no more
	$("#game-drawing").on("mousedown touchstart", function() {
		//if this is their first mark
		if (self.canvas.isBlank && self.timeLimit > 0 && !self.submitTimer) {
			//start the timer
			self.displayTimerInterval = startTimer(self.timeLimit, function(
				timeLeft
			) {
				self.timerDisplay.text(
					timeLeft + " left to finish your drawing"
				);
			});
			self.submitTimer = window.setTimeout(function() {
				//when the time runs out...
				//we don't care if it is blank
				self.canvas.isBlank = false;
				//submit
				self.onDone();
			}, self.timeLimit * 1000);
		}
		self.canvas.isBlank = false;
	});

	doneButton.click(function() {
		self.onDone();
	});

	//run done when enter key is pressed in word input
	$("#game-word-in").keypress(function(e) {
		var key = e.which;
		if (key === 13) {
			self.onDone();
		}
	});
};

Game.prototype.show = function() {
	Screen.prototype.show.call(this);
	Screen.prototype.setSubtitle.call(
		this,
		"Game code: " + Screen.getGameCodeHTML()
	);

	//allow touch events on the canvas
	$("#game-drawing").css("pointer-events", "auto");
	this.done = false;
};

Game.prototype.showDrawing = function(disallowChanges) {
	if (!disallowChanges) {
		this.canvas = getDrawingCanvas();
	}

	var shouldShowUndoButtons;

	showElement("#game-drawing");
	this.show();

	if (this.timeLimit > 0) {
		this.timerDisplay.text("Begin drawing to start the timer.");

		if (this.timeLimit <= 5) {
			//if the time limit is less than 5 seconds
			//	don't show the undo button
			//because players don't really have enough time to try drawing again
			//	when they only have 5 seconds
			shouldShowUndoButtons = false;
		} else {
			shouldShowUndoButtons = true;
		}
	} else {
		this.timerDisplay.text("No time limit to draw.");
		shouldShowUndoButtons = true;
	}

	if (disallowChanges) {
		//lock the canvas so the user can't make any changes
		$("#game-drawing").css("pointer-events", "none");
		shouldShowUndoButtons = false;
	}

	this.showButtons(shouldShowUndoButtons);
};

Game.prototype.showWord = function() {
	showElement("#game-word");
	this.showButtons(false);
	this.show();
};

Game.prototype.showWordPicker = function(wordChoices) {
	$("#word-picker label.active").removeClass("active");
	for (let i = 0; i < 4; i++) {
		console.log($(`#word-picker input:nth-child(${i + 1})`));

		// set text and value of radio button
		$(`#word-picker label:nth-child(${i + 1}) span`).text(wordChoices[i]);
		$(`#word-picker label:nth-child(${i + 1}) input`).val(wordChoices[i]);
	}
	showElement("#word-picker-wrapper");
	this.showButtons(false);
	this.show();
};

Game.prototype.showButtons = function(showClearButton) {
	if (showClearButton) {
		showElement("#game-drawing-redo");
		showElement("#game-drawing-undo");
		$("#game-drawing-redo").addClass("disabled");
		$("#game-drawing-undo").addClass("disabled");
	} else {
		$("#game-drawing-redo").addClass(HIDDEN);
		$("#game-drawing-undo").addClass(HIDDEN);
	}
	showElement("#game-buttons");
};

Game.prototype.hideBoth = function() {
	$("#game-drawing").addClass(HIDDEN);
	$("#game-word").addClass(HIDDEN);
	$("#game-buttons").addClass(HIDDEN);
	$("#word-picker-wrapper").addClass(HIDDEN);
};

Game.prototype.newLink = function(res) {
	var lastLink = res.data.link;
	var lastLinkType = lastLink.type;
	var count = res.data.count;
	var finalCount = res.data.finalCount;
	var newLinkType =
		lastLinkType === DRAWING || lastLinkType === FIRST_WORD
			? WORD
			: DRAWING;
	this.timeLimit = res.data.timeLimit;

	console.log("last link type", lastLinkType);

	if (lastLinkType === DRAWING) {
		//show the previous drawing
		console.log(lastLink);
		$("#game-word-drawingtoname").attr("src", lastLink.data);

		Screen.prototype.setTitle.call(this, "What is this a drawing of?");

		//show the word creator
		this.showWord();
	} else if (lastLinkType === WORD) {
		console.log(lastLink);
		Screen.prototype.setTitle.call(this, "Please draw: " + lastLink.data);

		//show drawing creator
		this.showDrawing();

		//calculate size of canvas dynamically
		this.resizeCanvas();
	} else if (lastLinkType === FIRST_WORD) {
		$("#game-word-drawingtoname").removeAttr("src");
		Screen.prototype.setTitle.call(this, "What should be drawn?");

		//show the word creator
		// this.showWord();
		console.log("before showing word picker");
		console.log(lastLink);
		this.showWordPicker(lastLink.wordChoices);
	}

	Screen.prototype.setSubtitle.call(
		this,
		this.subtitle + " &nbsp; - &nbsp; " + count + "/" + finalCount
	);

	//this will be ran when the done button is clicked, or
	//  the enter key is pressed in the word input
	this.onDone = function() {
		this.checkIfDone(newLinkType, lastLink);
	};
	Screen.waitingForResponse = false;
};

Game.prototype.checkIfDone = function(newLinkType, lastLink) {
	console.log($("word-picker"));
	console.log("in check if done");
	console.log("New link type", newLinkType);
	console.log("Last link type", lastLink.type);

	this.done = true;

	//disable the submit timer to prevent duplicate sends
	clearTimeout(this.submitTimer);
	clearInterval(this.displayTimerInterval);
	this.submitTimer = undefined;
	this.displayTimerInterval = undefined;

	//hide the drawing
	this.hideBoth();

	var newLink;
	if (newLinkType === DRAWING) {
		if (this.canvas.isBlank) {
			showElement("#game-drawing");
			showElement("#game-buttons");
			swal(
				"Your picture is blank!",
				"Please draw a picture, then try again.",
				"info"
			);
		} else {
			// convert canvas to an SVG string, encode it in base64, and send it as a dataurl
			newLink = "data:image/svg+xml;base64," + btoa(this.canvas.toSVG());

			this.canvas.remove();
			this.sendLink(newLinkType, newLink);
		}
	} else if (newLinkType === WORD) {
		newLink = $("#game-word-in")
			.val()
			.trim();
		if (lastLink.type === FIRST_WORD) {
			newLink = $("#word-picker label.active input").val();
		}
		//check if it is blank
		if (!newLink) {
			if (lastLink.type === FIRST_WORD) {
				this.showWordPicker(lastLink.wordChoices);
				console.log("have not picked a word");
			} else {
				this.showWord();
				swal(
					"Your guess is blank!",
					"Please enter a guess, then try again.",
					"info"
				);
			}
		} else {
			//clear the input
			$("#game-word-in").val("");
			this.sendLink(newLinkType, newLink);
		}
	}
};

Game.prototype.sendLink = function(type, data) {
	Screen.prototype.setTitle.call(this, "Sending...");

	socket.emit("finishedLink", {
		link: {
			type: type,
			data: data
		}
	});
	this.onWait();
};

Game.prototype.resizeCanvas = function() {
	var container = $("#game-drawing");
	if (this.canvas) {
		this.canvas.setHeight(container.width());
		this.canvas.setWidth(container.width());
		this.canvas.renderAll();
	}
};

Game.prototype.setTimer = function() {
	if (this.timeLimit && !this.timeLimit === 0) {
		window.setTimeout();
	}
};
