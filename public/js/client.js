//
//  Drawphone Client
//  By Tanner Krewson
//

/* global $, swal, fabric, io, ga */

//prevent page from refreshing when Join game buttons are pressed
$(function() {
	$("form").submit(function() {
		return false;
	});
});

//
//  Constants
//
const HIDDEN = "hidden";
const DRAWING = "drawing";
const WORD = "word";
const FIRST_WORD = "first-word";

//
//  UI Methods
//

function hideAll() {
	$("#mainmenu").addClass(HIDDEN);
	$("#joinmenu").addClass(HIDDEN);
	$("#newmenu").addClass(HIDDEN);
	$("#lobby").addClass(HIDDEN);
	$("#game").addClass(HIDDEN);
	$("#result").addClass(HIDDEN);
	$("#waiting").addClass(HIDDEN);
	$("#replace").addClass(HIDDEN);
}

function showElement(jq) {
	$(jq).removeClass(HIDDEN);
}

// http://stackoverflow.com/questions/20618355/the-simplest-possible-javascript-countdown-timer
function startTimer(duration, onTick) {
	var timer = duration,
		minutes,
		seconds;

	var tick = function() {
		minutes = parseInt(timer / 60, 10);
		seconds = parseInt(timer % 60, 10);

		minutes = minutes < 10 ? "0" + minutes : minutes;
		seconds = seconds < 10 ? "0" + seconds : seconds;

		onTick(minutes + ":" + seconds);

		if (--timer < 0) {
			timer = duration;
		}
	};

	tick();
	return setInterval(tick, 1000);
}

//
//  Objects
//

function Drawphone() {
	this.screens = [];

	var self = this;
	this.mainMenu = new MainMenu(
		function() {
			//ran when Join Game button is pressed
			self.joinMenu.show();
		},
		function() {
			//ran when New Game button is pressed
			self.newMenu.show();
		}
	);

	this.joinMenu = new JoinMenu(function() {
		//ran when Back button is pressed
		self.mainMenu.show();
	});

	this.newMenu = new NewMenu(function() {
		//ran when Back button is pressed
		self.mainMenu.show();
	});

	this.lobby = new Lobby();

	this.game = new Game(function() {
		//ran when the player sends
		self.waiting.show();
	});

	this.results = new Results(function() {
		//ran when done button on results page is tapped
		self.lobby.show();
	});

	this.waiting = new Waiting();

	this.replace = new Replace();

	this.screens.push(this.mainMenu);
	this.screens.push(this.joinMenu);
	this.screens.push(this.newMenu);
	this.screens.push(this.lobby);
	this.screens.push(this.game);
	this.screens.push(this.results);
	this.screens.push(this.waiting);
	this.screens.push(this.replace);
}

Drawphone.prototype.initializeAll = function() {
	this.screens.forEach(function(screen) {
		screen.initialize();
	});

	this.attachSocketListeners();
};

Drawphone.prototype.attachSocketListeners = function() {
	socket.on("joinGameRes", this.lobby.show.bind(this.lobby));

	socket.on("updatePlayerList", this.lobby.update.bind(this.lobby));

	socket.on("nextLink", this.game.newLink.bind(this.game));

	socket.on("viewResults", this.results.show.bind(this.results));

	socket.on("showWaitingList", this.waiting.show.bind(this.waiting));

	socket.on(
		"updateWaitingList",
		this.waiting.updateWaitingList.bind(this.waiting)
	);

	socket.on("replacePlayer", this.replace.show.bind(this.replace));
};

Drawphone.prototype.begin = function() {
	this.mainMenu.show();
};

// https://github.com/abhi06991/Undo-Redo-Fabricjs
function getDrawingCanvas() {
	var thisCanvas = new fabric.Canvas("game-drawing-canvas");
	thisCanvas.isDrawingMode = true;
	thisCanvas.isBlank = true;

	var state = {
		canvasState: [],
		currentStateIndex: -1,
		undoStatus: false,
		redoStatus: false,
		undoFinishedStatus: 1,
		redoFinishedStatus: 1,
		undoButton: $("#game-drawing-undo"),
		redoButton: $("#game-drawing-redo")
	};
	thisCanvas.on("path:created", function() {
		updateCanvasState();
	});

	var updateCanvasState = function() {
		state.undoButton.removeClass("disabled");
		thisCanvas.isBlank = false;
		if (state.undoStatus == false && state.redoStatus == false) {
			var jsonData = thisCanvas.toJSON();
			var canvasAsJson = JSON.stringify(jsonData);
			if (state.currentStateIndex < state.canvasState.length - 1) {
				var indexToBeInserted = state.currentStateIndex + 1;
				state.canvasState[indexToBeInserted] = canvasAsJson;
				var numberOfElementsToRetain = indexToBeInserted + 1;
				state.canvasState = state.canvasState.splice(
					0,
					numberOfElementsToRetain
				);
			} else {
				state.canvasState.push(canvasAsJson);
			}
			state.currentStateIndex = state.canvasState.length - 1;
			if (
				state.currentStateIndex == state.canvasState.length - 1 &&
				state.currentStateIndex != -1
			) {
				state.redoButton.addClass("disabled");
			}
		}
	};

	var undo = function() {
		if (state.undoFinishedStatus) {
			if (state.currentStateIndex == -1) {
				state.undoStatus = false;
			} else {
				if (state.canvasState.length >= 1) {
					state.undoFinishedStatus = 0;
					if (state.currentStateIndex != 0) {
						state.undoStatus = true;
						thisCanvas.loadFromJSON(
							state.canvasState[state.currentStateIndex - 1],
							function() {
								thisCanvas.renderAll();
								state.undoStatus = false;
								state.currentStateIndex -= 1;
								state.undoButton.removeClass("disabled");
								if (
									state.currentStateIndex !==
									state.canvasState.length - 1
								) {
									state.redoButton.removeClass("disabled");
								}
								state.undoFinishedStatus = 1;
							}
						);
					} else if (state.currentStateIndex == 0) {
						thisCanvas.clear();
						state.undoFinishedStatus = 1;
						state.undoButton.addClass("disabled");
						state.redoButton.removeClass("disabled");
						thisCanvas.isBlank = true;
						state.currentStateIndex -= 1;
					}
				}
			}
		}
	};

	var redo = function() {
		if (state.redoFinishedStatus) {
			if (
				state.currentStateIndex == state.canvasState.length - 1 &&
				state.currentStateIndex != -1
			) {
				state.redoButton.addClass("disabled");
			} else {
				if (
					state.canvasState.length > state.currentStateIndex &&
					state.canvasState.length != 0
				) {
					state.redoFinishedStatus = 0;
					state.redoStatus = true;
					thisCanvas.loadFromJSON(
						state.canvasState[state.currentStateIndex + 1],
						function() {
							thisCanvas.isBlank = false;
							thisCanvas.renderAll();
							state.redoStatus = false;
							state.currentStateIndex += 1;
							if (state.currentStateIndex != -1) {
								state.undoButton.removeClass("disabled");
							}
							state.redoFinishedStatus = 1;
							if (
								state.currentStateIndex ==
									state.canvasState.length - 1 &&
								state.currentStateIndex != -1
							) {
								state.redoButton.addClass("disabled");
							}
						}
					);
				}
			}
		}
	};

	state.undoButton.on("click", undo);
	state.redoButton.on("click", redo);

	thisCanvas.remove = function() {
		state.undoButton.off("click");
		state.redoButton.off("click");
		thisCanvas.dispose();
		$("#game-drawing-canvas").empty();
	};

	return thisCanvas;
}

//
//  Main
//

var socket = io({ autoConnect: false });

//try to join the dev game
var relativeUrl = window.location.pathname + window.location.search;

if (relativeUrl === "/dev") {
	socket.open();
	socket.emit("joinGame", {
		code: "ffff",
		name: Math.random()
			.toString()
			.substring(2, 6)
	});
}

var drawphone = new Drawphone();
drawphone.initializeAll();
drawphone.begin();

if (relativeUrl === "/archive") {
	renderArchive();
}

async function renderArchive() {
	var archive = $("#archive");
	var archiveContent = $("#archive-content");
	var result = $("#result");
	if (!localStorage) {
		archiveContent.text("This browser does not support local storage.");
		return;
	}

	var resultsList = (await getResultsListFromStorage()).reverse();

	if (resultsList.length === 0) {
		archiveContent.text(
			"No results found on this device. Play a game first!"
		);
		return;
	}

	var lastDate;
	for (var i = 0; i < resultsList.length; i++) {
		var results = resultsList[i];

		var theDate = new Date(results.date).toLocaleDateString("en-us", {
			weekday: "long",
			year: "numeric",
			month: "long",
			day: "numeric"
		});

		if (theDate !== lastDate) {
			if (i > 0) archiveContent.append("<br>");
			archiveContent.append(theDate);

			lastDate = theDate;
		}

		var button = $(
			'<button type="button">' +
				getQuickInfoStringOfResults(results) +
				"</button>"
		);
		button.addClass("btn btn-default prevresbtn");

		(function(chains) {
			button.click(function() {
				drawphone.results.show(
					{
						data: { chains },
						you: { id: "this id doesn't exist" }
					},
					true
				);

				result.show();
				archive.hide();

				//jump to top of the page
				window.scrollTo(0, 0);

				ga("send", "event", "Archive", "display another chain");
			});
		})(results.chains);
		archiveContent.append(button);
	}

	drawphone.results.onDoneViewingResults = function() {
		archive.show();
		result.hide();

		//jump to top of the page
		window.scrollTo(0, 0);
	};
}

function addResultsToStorage(chains) {
	var db = initArchiveDb();
	db.archive.add({ date: new Date(), chains });
}

function getResultsListFromStorage() {
	var db = initArchiveDb();
	return db.archive.toArray();
}

function initArchiveDb() {
	var db = new Dexie("DrawphoneDatabase");
	db.version(1).stores({
		archive: "++id,date,chains"
	});
	return db;
}

function getQuickInfoStringOfResults(results) {
	var result = "";
	result += new Date(results.date).toLocaleTimeString("en-us", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true
	});
	result += ": ";

	var firstChainLinks = results.chains[0].links;
	result += firstChainLinks[0].data;
	result += " to ";
	result += firstChainLinks[firstChainLinks.length - 1].data;

	if (results.chains.length === 1) return result;

	result += ", ";
	var secondChainLinks = results.chains[1].links;
	result += secondChainLinks[0].data;
	result += " to ";
	result += secondChainLinks[secondChainLinks.length - 1].data;
	result += ", etc.";
	return result;
}
