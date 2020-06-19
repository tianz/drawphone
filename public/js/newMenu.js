NewMenu.prototype = Object.create(Screen.prototype);

function NewMenu(onBack) {
	Screen.call(this);

	this.id = "#newmenu";
	this.backButton = $("#newmenu-back");
	this.goButton = $("#newmenu-go");
	this.onBack = onBack;

	Screen.prototype.setDefaultTitles.call(this);
}

NewMenu.prototype.initialize = function() {
	Screen.prototype.initialize.call(this);

	this.backButton.click(this.onBack);
	this.goButton.click(function() {
		if (!Screen.waitingForResponse) {
			Screen.waitingForResponse = true;
			var name = $("#newinname").val();

			socket.open();
			socket.emit("newGame", {
				name: name
			});
		}
	});
};
