import Screen from "./screen";

NewMenu.prototype = Object.create(Screen.prototype);

export default function NewMenu(onBack, socket) {
  Screen.call(this);

  this.id = "#newmenu";
  this.backButton = $("#newmenu-back");
  this.goButton = $("#newmenu-go");
  this.onBack = onBack;
  this.socket = socket;

  Screen.prototype.setDefaultTitles.call(this);
}

NewMenu.prototype.initialize = function() {
  Screen.prototype.initialize.call(this);

  this.backButton.click(this.onBack);
  let self = this;
  this.goButton.click(function() {
    if (!Screen.waitingForResponse) {
      Screen.waitingForResponse = true;
      var name = $("#newinname").val();
      console.log(this);
      self.socket.open();
      self.socket.emit("newGame", {
        name: name
      });
    }
  });
};
