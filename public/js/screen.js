function Screen() {
	this.id = "";
	this.title = "Loading Drawphone...";
	this.subtitle = "Just a moment!";

	this.defaultTitle = "传画筒";
	this.defaultSubtitle = "一个画画接龙游戏";
}

Screen.prototype.initialize = function() {};

Screen.prototype.show = function() {
	hideAll();
	showElement(this.id);

	$("#title").html(this.title);
	$("#subtitle").text(this.subtitle);
};

Screen.prototype.setTitle = function(title) {
	this.title = title;
	$("#title").html(this.title);
};

Screen.prototype.setSubtitle = function(subtitle) {
	this.subtitle = subtitle;
	$("#subtitle").html(this.subtitle);
};

Screen.prototype.showTitles = function() {
	$("#title").html(this.title);
	$("#subtitle").html(this.subtitle);
};

Screen.prototype.setDefaultTitles = function() {
	this.setTitle(this.defaultTitle);
	this.setSubtitle(this.defaultSubtitle);
};

Screen.waitingForResponse = false;

Screen.gameCode = "";

Screen.getGameCodeHTML = function() {
	return '<span class="gamecode">' + Screen.gameCode + "</span>";
};
