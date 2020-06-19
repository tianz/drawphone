function UserList(ul) {
	this.ul = ul;
	this.numberOfPlayers = 0;
}

UserList.prototype.update = function(newList, disconnectedList, onPress) {
	//clear all of the user boxes using jquery
	this.ul.empty();

	this.draw(newList, false, onPress);
	if (disconnectedList) {
		if (disconnectedList.length > 0) {
			$("#waiting-disconnectedmsg").removeClass(HIDDEN);
			this.draw(disconnectedList, true);
		} else {
			$("#waiting-disconnectedmsg").addClass(HIDDEN);
		}
	}
};

UserList.prototype.draw = function(list, makeBoxDark, onPress) {
	this.numberOfPlayers = 0;
	for (var i = 0; i < list.length; i++) {
		this.numberOfPlayers++;
		var listBox = $("<span></span>");
		var listItem = $("<li>" + list[i].name + "</li>").appendTo(listBox);
		listItem.addClass("user");
		if (makeBoxDark) {
			listItem.addClass("disconnected");
		}
		listBox.addClass("col-xs-6");
		listBox.addClass("user-container");
		if (onPress) {
			(function(player) {
				listBox.click(function() {
					onPress(player);
				});
			})(list[i]);
		}
		listBox.appendTo(this.ul);
	}
};
