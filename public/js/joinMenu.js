JoinMenu.prototype = Object.create(Screen.prototype);

function JoinMenu(onBack) {
	Screen.call(this);

	this.id = "#joinmenu";
	this.backButton = $("#joinmenu-back");
	this.goButton = $("#joinmenu-go");
	this.codeInput = $("#joinincode");
	this.onBack = onBack;

	Screen.prototype.setDefaultTitles.call(this);
}

JoinMenu.prototype.initialize = function() {
	Screen.prototype.initialize.call(this);

	this.backButton.click(this.onBack);
	this.goButton.click(function() {
		if (!Screen.waitingForResponse) {
			Screen.waitingForResponse = true;
			var code = $("#joinincode").val();
			var name = $("#joininname").val();

			socket.open();
			socket.emit("joinGame", {
				code: code,
				name: name
			});
		}
	});

	var self = this;

	this.codeInput.on("input", function() {
		self.codeInput.val(
			self.codeInput
				.val()
				.substring(0, 4)
				.toLowerCase()
				.replace(/[^a-z]/g, "")
		);
		if (self.codeInput.val()) {
			self.codeInput.addClass("gamecode-entry");
		} else {
			self.codeInput.removeClass("gamecode-entry");
		}
	});

	Screen.prototype.setDefaultTitles.call(this);
};
