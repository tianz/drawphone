import "fabric";

import Screen from "./screen";
import * as constants from "./constants";
import * as utils from "./utils";

const PICKING = "picking";
const DRAWING = "drawing";
const GUESSING = "guessing";

Game.prototype = Object.create(Screen.prototype);

export default function Game(onWait, socket) {
  Screen.call(this);

  this.id = "#game";
  this.onWait = onWait;

  this.wordInput = $("#game-word-in");
  this.timerDisplay = $("#game-timer");

  // Buttons
  this.undoButton = $("#game-drawing-undo");
  this.redoButton = $("#game-drawing-redo");
  this.changeButton = $("#game-change-words");
  this.doneButton = $("#game-send");

  this.canvas;

  this.submitTimer;

  this.socket = socket;

  this.words;

  window.addEventListener("resize", this.resizeCanvas.bind(this), false);
}

Game.prototype.initialize = function() {
  Screen.prototype.initialize.call(this);

  //bind clear canvas to clear drawing button
  var self = this;

  //if user touches the canvas, it not blank no more
  $("#game-drawing").on("mousedown touchstart", function() {
    //if this is their first mark
    if (self.canvas.isBlank && self.timeLimit > 0 && !self.submitTimer) {
      //start the timer
      self.displayTimerInterval = startTimer(self.timeLimit, function(
        timeLeft
      ) {
        self.timerDisplay.text(timeLeft + " left to finish your drawing");
      });
      self.submitTimer = window.setTimeout(function() {
        //when the time runs out...
        //we don't care if it is blank
        self.canvas.isBlank = false;
        //submit
        self.onDone();
      }, self.timeLimit * 1000);
    }
    self.canvas.isBlank = false;
  });

  self.doneButton.click(function() {
    self.onDone();
  });

  self.changeButton.click(function() {
    self.onChangeWords();
  });

  //run done when enter key is pressed in word input
  $("#game-word-in").keypress(function(e) {
    var key = e.which;
    if (key === 13) {
      self.onDone();
    }
  });
};

Game.prototype.show = function() {
  Screen.prototype.show.call(this);
  Screen.prototype.setSubtitle.call(
    this,
    "Game code: " + Screen.getGameCodeHTML()
  );

  //allow touch events on the canvas
  $("#game-drawing").css("pointer-events", "auto");
  this.done = false;
};

Game.prototype.showDrawing = function(disallowChanges) {
  if (!disallowChanges) {
    this.canvas = getDrawingCanvas();
  }

  utils.showElement("#game-drawing");
  this.show();

  if (this.timeLimit > 0) {
    this.timerDisplay.text("Begin drawing to start the timer.");
  } else {
    this.timerDisplay.text("No time limit to draw.");
  }

  if (disallowChanges) {
    //lock the canvas so the user can't make any changes
    $("#game-drawing").css("pointer-events", "none");
  }

  this.showButtonsFor(DRAWING);
};

Game.prototype.showWord = function() {
  utils.showElement("#game-word");
  this.showButtonsFor(GUESSING);
  this.show();
};

Game.prototype.showButtonsFor = function(phase) {
  if (phase === PICKING) {
    utils.hide(this.undoButton);
    utils.hide(this.redoButton);
    utils.show(this.changeButton);
  } else if (phase === DRAWING) {
    utils.show(this.undoButton);
    utils.show(this.redoButton);
    utils.hide(this.changeButton);
  } else if (phase === GUESSING) {
    utils.hide(this.undoButton);
    utils.hide(this.redoButton);
    utils.hide(this.changeButton);
  } else {
    console.error(`Unknown phase: ${phase}`);
  }
  utils.showElement("#game-buttons");
};

Game.prototype.showWordPicker = function(wordChoices) {
  $("#word-picker label.active").removeClass("active");
  for (let i = 0; i < 4; i++) {
    // set text and value of radio button
    $(`#word-picker label:nth-child(${i + 1}) span`).text(wordChoices[i]);
    $(`#word-picker label:nth-child(${i + 1}) input`).val(wordChoices[i]);
  }
  utils.showElement("#word-picker-wrapper");
  this.showButtonsFor(PICKING);
  this.show();
};

Game.prototype.showButtons = function(showClearButton) {
  if (showClearButton) {
    utils.showElement("#game-drawing-redo");
    utils.showElement("#game-drawing-undo");
    this.undoButton.addClass("disabled");
    this.redoButton.addClass("disabled");
  } else {
    utils.hideElement("#game-drawing-redo");
    utils.hideElement("#game-drawing-undo");
  }
  utils.showElement("#game-buttons");
};

Game.prototype.hideBoth = function() {
  $("#game-drawing").addClass(constants.HIDDEN);
  $("#game-word").addClass(constants.HIDDEN);
  $("#game-buttons").addClass(constants.HIDDEN);
  $("#word-picker-wrapper").addClass(constants.HIDDEN);
};

Game.prototype.newLink = function(res) {
  var lastLink = res.data.link;
  var lastLinkType = lastLink.type;
  var count = res.data.count;
  var finalCount = res.data.finalCount;
  var newLinkType =
    lastLinkType === constants.DRAWING || lastLinkType === constants.FIRST_WORD
      ? constants.WORD
      : constants.DRAWING;
  this.timeLimit = res.data.timeLimit;

  if (lastLinkType === constants.DRAWING) {
    //show the previous drawing
    $("#game-word-drawingtoname").attr("src", lastLink.data);

    Screen.prototype.setTitle.call(
      this,
      `猜猜这是什么？${lastLink.wordLen}个字`
    );

    //show the word creator
    this.showWord();
  } else if (lastLinkType === constants.WORD) {
    Screen.prototype.setTitle.call(this, "请画出: " + lastLink.data);

    //show drawing creator
    this.showDrawing();

    //calculate size of canvas dynamically
    this.resizeCanvas();
  } else if (lastLinkType === constants.FIRST_WORD) {
    $("#game-word-drawingtoname").removeAttr("src");
    Screen.prototype.setTitle.call(this, "请选择一个词?");

    this.words = lastLink.wordChoices;
    this.showWordPicker(lastLink.wordChoices);
  }

  Screen.prototype.setSubtitle.call(
    this,
    this.subtitle + " &nbsp; - &nbsp; " + count + "/" + finalCount
  );

  //this will be ran when the done button is clicked, or
  //  the enter key is pressed in the word input
  this.onDone = function() {
    this.checkIfDone(newLinkType, lastLink);
  };

  this.onChangeWords = function() {
    for (let i = 0; i < 4; i++) {
      // set text and value of radio button
      $(`#word-picker label:nth-child(${i + 1}) span`).text(this.words[i + 4]);
      $(`#word-picker label:nth-child(${i + 1}) input`).val(this.words[i + 4]);
    }
    $(`#word-picker label.active`).removeClass("active");
    utils.hide(this.changeButton);
  };

  Screen.waitingForResponse = false;
};

Game.prototype.checkIfDone = function(newLinkType, lastLink) {
  this.done = true;

  //disable the submit timer to prevent duplicate sends
  clearTimeout(this.submitTimer);
  clearInterval(this.displayTimerInterval);
  this.submitTimer = undefined;
  this.displayTimerInterval = undefined;

  //hide the drawing
  this.hideBoth();

  var newLink;
  if (newLinkType === constants.DRAWING) {
    if (this.canvas.isBlank) {
      utils.showElement("#game-drawing");
      utils.showElement("#game-buttons");
      swal(
        "Your picture is blank!",
        "Please draw a picture, then try again.",
        "info"
      );
    } else {
      // convert canvas to an SVG string, encode it in base64, and send it as a dataurl
      newLink = "data:image/svg+xml;base64," + btoa(this.canvas.toSVG());

      this.canvas.remove();
      this.sendLink(newLinkType, newLink);
    }
  } else if (newLinkType === constants.WORD) {
    newLink = $("#game-word-in")
      .val()
      .trim();
    if (lastLink.type === constants.FIRST_WORD) {
      newLink = $("#word-picker label.active input").val();
    }
    //check if it is blank
    if (!newLink) {
      if (lastLink.type === constants.FIRST_WORD) {
        this.showWordPicker(lastLink.wordChoices);
        swal({
          title: "请选择你想画的词",
          icon: "error"
        });
      } else {
        this.showWord();
        swal(
          "Your guess is blank!",
          "Please enter a guess, then try again.",
          "info"
        );
      }
    } else {
      //clear the input
      $("#game-word-in").val("");
      this.sendLink(newLinkType, newLink);
    }
  }
};

Game.prototype.sendLink = function(type, data) {
  Screen.prototype.setTitle.call(this, "Sending...");

  this.socket.emit("finishedLink", {
    link: {
      type: type,
      data: data
    }
  });
  this.onWait();
};

Game.prototype.resizeCanvas = function() {
  var container = $("#game-drawing");
  if (this.canvas) {
    this.canvas.setHeight(container.width());
    this.canvas.setWidth(container.width());
    this.canvas.renderAll();
  }
};

Game.prototype.setTimer = function() {
  if (this.timeLimit && !this.timeLimit === 0) {
    window.setTimeout();
  }
};

function getDrawingCanvas() {
  var thisCanvas = new fabric.Canvas("game-drawing-canvas");
  thisCanvas.isDrawingMode = true;
  thisCanvas.isBlank = true;

  var state = {
    canvasState: [],
    currentStateIndex: -1,
    undoStatus: false,
    redoStatus: false,
    undoFinishedStatus: 1,
    redoFinishedStatus: 1,
    undoButton: $("#game-drawing-undo"),
    redoButton: $("#game-drawing-redo")
  };
  thisCanvas.on("path:created", function() {
    updateCanvasState();
  });

  var updateCanvasState = function() {
    state.undoButton.removeClass("disabled");
    thisCanvas.isBlank = false;
    if (state.undoStatus == false && state.redoStatus == false) {
      var jsonData = thisCanvas.toJSON();
      var canvasAsJson = JSON.stringify(jsonData);
      if (state.currentStateIndex < state.canvasState.length - 1) {
        var indexToBeInserted = state.currentStateIndex + 1;
        state.canvasState[indexToBeInserted] = canvasAsJson;
        var numberOfElementsToRetain = indexToBeInserted + 1;
        state.canvasState = state.canvasState.splice(
          0,
          numberOfElementsToRetain
        );
      } else {
        state.canvasState.push(canvasAsJson);
      }
      state.currentStateIndex = state.canvasState.length - 1;
      if (
        state.currentStateIndex == state.canvasState.length - 1 &&
        state.currentStateIndex != -1
      ) {
        state.redoButton.addClass("disabled");
      }
    }
  };

  var undo = function() {
    if (state.undoFinishedStatus) {
      if (state.currentStateIndex == -1) {
        state.undoStatus = false;
      } else {
        if (state.canvasState.length >= 1) {
          state.undoFinishedStatus = 0;
          if (state.currentStateIndex != 0) {
            state.undoStatus = true;
            thisCanvas.loadFromJSON(
              state.canvasState[state.currentStateIndex - 1],
              function() {
                thisCanvas.renderAll();
                state.undoStatus = false;
                state.currentStateIndex -= 1;
                state.undoButton.removeClass("disabled");
                if (state.currentStateIndex !== state.canvasState.length - 1) {
                  state.redoButton.removeClass("disabled");
                }
                state.undoFinishedStatus = 1;
              }
            );
          } else if (state.currentStateIndex == 0) {
            thisCanvas.clear();
            state.undoFinishedStatus = 1;
            state.undoButton.addClass("disabled");
            state.redoButton.removeClass("disabled");
            thisCanvas.isBlank = true;
            state.currentStateIndex -= 1;
          }
        }
      }
    }
  };

  var redo = function() {
    if (state.redoFinishedStatus) {
      if (
        state.currentStateIndex == state.canvasState.length - 1 &&
        state.currentStateIndex != -1
      ) {
        state.redoButton.addClass("disabled");
      } else {
        if (
          state.canvasState.length > state.currentStateIndex &&
          state.canvasState.length != 0
        ) {
          state.redoFinishedStatus = 0;
          state.redoStatus = true;
          thisCanvas.loadFromJSON(
            state.canvasState[state.currentStateIndex + 1],
            function() {
              thisCanvas.isBlank = false;
              thisCanvas.renderAll();
              state.redoStatus = false;
              state.currentStateIndex += 1;
              if (state.currentStateIndex != -1) {
                state.undoButton.removeClass("disabled");
              }
              state.redoFinishedStatus = 1;
              if (
                state.currentStateIndex == state.canvasState.length - 1 &&
                state.currentStateIndex != -1
              ) {
                state.redoButton.addClass("disabled");
              }
            }
          );
        }
      }
    }
  };

  state.undoButton.on("click", undo);
  state.redoButton.on("click", redo);

  thisCanvas.remove = function() {
    state.undoButton.off("click");
    state.redoButton.off("click");
    thisCanvas.dispose();
    $("#game-drawing-canvas").empty();
  };

  return thisCanvas;
}

// http://stackoverflow.com/questions/20618355/the-simplest-possible-javascript-countdown-timer
function startTimer(duration, onTick) {
  var timer = duration,
    minutes,
    seconds;

  var tick = function() {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    onTick(minutes + ":" + seconds);

    if (--timer < 0) {
      timer = duration;
    }
  };

  tick();
  return setInterval(tick, 1000);
}
