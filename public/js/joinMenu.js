import Screen from "./screen";

JoinMenu.prototype = Object.create(Screen.prototype);

export default function JoinMenu(onBack, socket) {
  Screen.call(this);

  this.id = "#joinmenu";
  this.backButton = $("#joinmenu-back");
  this.goButton = $("#joinmenu-go");
  this.codeInput = $("#joinincode");
  this.onBack = onBack;
  this.socket = socket;

  Screen.prototype.setDefaultTitles.call(this);
}

JoinMenu.prototype.initialize = function() {
  Screen.prototype.initialize.call(this);

  this.backButton.click(this.onBack);
  let self = this;
  this.goButton.click(function() {
    if (!Screen.waitingForResponse) {
      Screen.waitingForResponse = true;
      var code = $("#joinincode").val();
      var name = $("#joininname").val();

      self.socket.open();
      self.socket.emit("joinGame", {
        code: code,
        name: name
      });
    }
  });

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
