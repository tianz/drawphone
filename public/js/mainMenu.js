MainMenu.prototype = Object.create(Screen.prototype);

function MainMenu(onJoin, onNew) {
	Screen.call(this);

	this.id = "#mainmenu";
	this.joinButton = $("#joinbtn");
	this.newButton = $("#newbtn");
	this.archiveButton = $("#archivebtn");
	this.howButton = $("#howbtn");
	this.ssButton = $("#ssbtn");
	this.mgButton = $("#mgbtn");
	this.onJoin = onJoin;
	this.onNew = onNew;

	Screen.prototype.setDefaultTitles.call(this);
}

MainMenu.prototype.initialize = function() {
	Screen.prototype.initialize.call(this);

	this.joinButton.click(this.onJoin);
	this.newButton.click(this.onNew);
	this.archiveButton.click(function() {
		window.location.href = "/archive";
	});
	this.howButton.click(function() {
		window.location.href = "/how-to-play";
	});
	this.ssButton.click(function() {
		window.location.href = "/screenshots";
	});
	this.mgButton.click(function() {
		window.location.href = "/more-games";
	});
};
