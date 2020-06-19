Lobby.prototype = Object.create(Screen.prototype);

function Lobby() {
	Screen.call(this);

	this.id = "#lobby";
	this.leaveButton = $("#lobby-leave");
	this.startButton = $("#lobby-start");
	this.gameSettings = $("#lobby-settings");
	this.wordFirstCheckbox = $("#lobby-settings-wordfirst");
	this.timeLimitDropdown = $("#lobby-settings-timelimit");
	this.wordPackDropdown = $("#lobby-settings-wordpack");
	this.viewPreviousResultsButton = $("#lobby-prevres");
	this.gameCode = "";

	//this is what the admin selects from the dropdowns
	this.selectedTimeLimit = false;

	this.userList = new UserList($("#lobby-players"));
}

Lobby.prototype.initialize = function() {
	Screen.prototype.initialize.call(this);

	var self = this;
	this.leaveButton.click(function() {
		//refresh the page
		location.reload();
	});
	this.startButton.click(function() {
		var ready = !Screen.waitingForResponse && self.checkIfReadyToStart();
		if (self.userList.numberOfPlayers === 1 && ready) {
			swal(
				{
					title: "Demo mode",
					text:
						"Would you like to play Drawphone with just yourself to see how it works?",
					type: "info",
					showCancelButton: true
				},
				function() {
					self.start.bind(self)();
				}
			);
		} else if (ready) {
			self.start.bind(self)();
		} else {
			swal(
				"Not ready to start",
				"Make sure have selected a word pack, a drawing time limit, and that you have at least four players.",
				"error"
			);
		}
	});
	this.wordFirstCheckbox.on("change", function() {
		if (self.wordFirstCheckbox.is(":checked")) {
			self.wordPackDropdown.prop("selectedIndex", 0);
			self.wordPackDropdown.prop("disabled", true);
		} else {
			self.wordPackDropdown.prop("disabled", false);
		}
		self.checkIfReadyToStart();
	});
	this.timeLimitDropdown.on("change", function() {
		switch (self.timeLimitDropdown[0].value) {
			case "No time limit (recommended)":
				self.selectedTimeLimit = 0;
				break;
			case "5 seconds":
				self.selectedTimeLimit = 5;
				break;
			case "10 seconds":
				self.selectedTimeLimit = 10;
				break;
			case "15 seconds":
				self.selectedTimeLimit = 15;
				break;
			case "30 seconds":
				self.selectedTimeLimit = 30;
				break;
			case "1 minute":
				self.selectedTimeLimit = 60;
				break;
		}

		self.checkIfReadyToStart();
	});
	this.wordPackDropdown.on("change", function() {
		self.checkIfReadyToStart();
	});
	this.viewPreviousResultsButton.click(function() {
		socket.emit("viewPreviousResults", {});
	});

	this.wordFirstCheckbox.prop("checked", false);
	this.timeLimitDropdown.prop("selectedIndex", 0);
	this.wordPackDropdown.prop("selectedIndex", 0);
	this.wordPackDropdown.prop("disabled", false);
};

Lobby.prototype.show = function(data) {
	socket.off("disconnect");
	socket.on("disconnect", function() {
		swal("Connection lost!", "Reloading...", "error");
		//refresh the page
		location.reload();
	});

	//if this was called by a socket.io event
	if (data) {
		if (data.success) {
			Screen.gameCode = data.game.code;
			this.selectedTimeLimit = false;
			this.update({
				success: true,
				gameCode: data.game.code,
				player: data.you,
				data: {
					players: data.game.players,
					canViewLastRoundResults: data.game.canViewLastRoundResults
				}
			});
		} else {
			if (data.content) {
				swal({
					title: data.error,
					type: "error",
					text: data.content,
					html: true
				});
			} else {
				swal(data.error, "", "error");
			}
			Screen.waitingForResponse = false;
			return;
		}
	} else {
		//reset the word first wordFirstCheckbox
		this.wordFirstCheckbox.prop("checked", false);

		//reset the time limit selector
		this.selectedTimeLimit = false;
		this.timeLimitDropdown.prop("selectedIndex", 0);

		//reset the word pack selector
		this.wordPackDropdown.prop("selectedIndex", 0);
		this.wordPackDropdown.prop("disabled", false);

		//grey-out start button
		this.startButton.addClass("disabled");
	}
	Screen.waitingForResponse = false;

	Screen.prototype.show.call(this);
};

Lobby.prototype.update = function(res) {
	if (res.success) {
		Screen.gameCode = res.gameCode;
		this.title = "Game Code: " + Screen.getGameCodeHTML();
		this.subtitle = "Waiting for players...";
		this.userList.update(res.data.players);
		this.checkIfReadyToStart();

		if (res.player.isAdmin) {
			//show the start game button
			this.startButton.removeClass(HIDDEN);
			//show the game Settings
			this.gameSettings.removeClass(HIDDEN);
		} else {
			this.startButton.addClass(HIDDEN);
			this.gameSettings.addClass(HIDDEN);
		}

		if (res.data.canViewLastRoundResults) {
			this.viewPreviousResultsButton.removeClass(HIDDEN);
		} else {
			this.viewPreviousResultsButton.addClass(HIDDEN);
		}
	} else {
		swal("Error updating lobby", res.error, "error");
	}
};

Lobby.prototype.checkIfReadyToStart = function() {
	if (
		this.selectedTimeLimit !== false &&
		(this.userList.numberOfPlayers >= 4 ||
			this.userList.numberOfPlayers === 1)
	) {
		//un-grey-out start button
		this.startButton.removeClass("disabled");
		return true;
	} else {
		this.startButton.addClass("disabled");
		return false;
	}
};

Lobby.prototype.start = function() {
	Screen.waitingForResponse = true;
	let wordPack = null;
	if (!this.wordFirstCheckbox.is(":checked")) {
		wordPack = $(
			`${this.wordPackDropdown.selector} option:selected`
		).text();
	}
	socket.emit("tryStartGame", {
		timeLimit: this.selectedTimeLimit,
		wordPackName: wordPack
	});
};
