import UserList from "./userList";
import Screen from "./screen";
import * as constants from "./constants";

Waiting.prototype = Object.create(Screen.prototype);

export default function Waiting(socket) {
  Screen.call(this);

  this.id = "#waiting";
  Screen.prototype.setTitle.call(this, "Waiting for other players...");
  this.userList = new UserList($("#waiting-players"));
  this.socket = socket;
}

Waiting.prototype.show = function() {
  Screen.prototype.setSubtitle.call(this, $("subtitle").html());
  Screen.prototype.show.call(this);
};

Waiting.prototype.updateWaitingList = function(res) {
  //show/hide the admin notice
  if (res.you.isAdmin) {
    $("#waiting-adminmsg").removeClass(constants.HIDDEN);
  } else {
    $("#waiting-adminmsg").addClass(constants.HIDDEN);
  }
  let self = this;
  var notFinished = res.data.notFinished;
  var disconnected = res.data.disconnected;
  this.userList.update(notFinished, disconnected, function(tappedPlayer) {
    //ran when the client taps one of the usernames
    if (res.you.isAdmin) {
      swal(
        {
          title: "Kick " + tappedPlayer.name + "?",
          text: "Someone will have to join this game to replace them.",
          type: "warning",
          showCancelButton: true,
          confirmButtonClass: "btn-danger",
          confirmButtonText: "Kick",
          closeOnConfirm: false
        },
        function() {
          self.socket.emit("kickPlayer", {
            playerToKick: tappedPlayer
          });
          swal("Done!", tappedPlayer.name + " was kicked.", "success");
        }
      );
    }
  });
};
