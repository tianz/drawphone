Waiting.prototype = Object.create(Screen.prototype);

function Waiting() {
	Screen.call(this);

	this.id = "#waiting";
	Screen.prototype.setTitle.call(this, "Waiting for other players...");
	this.userList = new UserList($("#waiting-players"));
}

Waiting.prototype.show = function() {
	Screen.prototype.setSubtitle.call(this, $("subtitle").html());
	Screen.prototype.show.call(this);
};

Waiting.prototype.updateWaitingList = function(res) {
	//show/hide the admin notice
	if (res.you.isAdmin) {
		$("#waiting-adminmsg").removeClass(HIDDEN);
	} else {
		$("#waiting-adminmsg").addClass(HIDDEN);
	}
	var notFinished = res.data.notFinished;
	var disconnected = res.data.disconnected;
	this.userList.update(notFinished, disconnected, function(tappedPlayer) {
		//ran when the client taps one of the usernames
		if (res.you.isAdmin) {
			swal(
				{
					title: "Kick " + tappedPlayer.name + "?",
					text:
						"Someone will have to join this game to replace them.",
					type: "warning",
					showCancelButton: true,
					confirmButtonClass: "btn-danger",
					confirmButtonText: "Kick",
					closeOnConfirm: false
				},
				function() {
					socket.emit("kickPlayer", {
						playerToKick: tappedPlayer
					});
					swal(
						"Done!",
						tappedPlayer.name + " was kicked.",
						"success"
					);
					ga("send", "event", "User list", "Admin kick player");
				}
			);
			ga("send", "event", "User list", "Admin tap player");
		}
	});
};
