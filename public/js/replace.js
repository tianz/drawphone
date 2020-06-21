import Screen from "./screen";

Replace.prototype = Object.create(Screen.prototype);

export default function Replace(socket) {
  Screen.call(this);
  this.id = "#replace";
  this.socket = socket;
  Screen.prototype.setTitle.call(this, "Choose a player to replace");
}

Replace.prototype.initialize = function() {
  $("#replace-leave").click(function() {
    //refresh the page
    location.reload();
  });
  Screen.prototype.initialize.call(this);
};

Replace.prototype.show = function(data) {
  Screen.gameCode = data.gameCode;
  Screen.prototype.setSubtitle.call(this, "Ready to join game...");

  var choices = $("#replace-choices");
  var players = data.players;

  choices.empty();

  var self = this;
  players.forEach(function(player) {
    var button = $('<button type="button">' + player.name + "</button>");
    button.addClass("btn btn-default btn-lg");
    button.click(function() {
      self.sendChoice(player);
    });
    choices.append(button);
    choices.append("<br>");
  });
  Screen.prototype.show.call(this);
};

Replace.prototype.sendChoice = function(playerToReplace) {
  this.socket.emit("tryReplacePlayer", {
    playerToReplace: playerToReplace
  });
};
