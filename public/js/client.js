//
//  Drawphone Client
//  By Tanner Krewson
//

/* global $, swal, fabric, io, ga */

import $ from "jquery";
require("bootstrap");
import openSocket from "socket.io-client";

import MainMenu from "./mainMenu";
import JoinMenu from "./joinMenu";
import NewMenu from "./newMenu";
import Game from "./game";
import Results from "./results";
import Replace from "./replace";
import Waiting from "./waiting";
import Lobby from "./lobby";

//prevent page from refreshing when Join game buttons are pressed
$(function() {
  $("form").submit(function() {
    return false;
  });
});

function Drawphone() {
  this.screens = [];

  var self = this;
  this.mainMenu = new MainMenu(
    function() {
      //ran when Join Game button is pressed
      self.joinMenu.show();
    },
    function() {
      //ran when New Game button is pressed
      self.newMenu.show();
    }
  );

  this.joinMenu = new JoinMenu(function() {
    //ran when Back button is pressed
    self.mainMenu.show();
  }, socket);

  this.newMenu = new NewMenu(function() {
    //ran when Back button is pressed
    self.mainMenu.show();
  }, socket);

  this.lobby = new Lobby(socket);

  this.game = new Game(function() {
    //ran when the player sends
    self.waiting.show();
  }, socket);

  this.results = new Results(function() {
    //ran when done button on results page is tapped
    self.lobby.show();
  }, socket);

  this.waiting = new Waiting(socket);

  this.replace = new Replace(socket);

  this.screens.push(this.mainMenu);
  this.screens.push(this.joinMenu);
  this.screens.push(this.newMenu);
  this.screens.push(this.lobby);
  this.screens.push(this.game);
  this.screens.push(this.results);
  this.screens.push(this.waiting);
  this.screens.push(this.replace);
}

Drawphone.prototype.initializeAll = function() {
  this.screens.forEach(function(screen) {
    screen.initialize();
  });

  this.attachSocketListeners();
};

Drawphone.prototype.attachSocketListeners = function() {
  socket.on("joinGameRes", this.lobby.show.bind(this.lobby));

  socket.on("updatePlayerList", this.lobby.update.bind(this.lobby));

  socket.on("nextLink", this.game.newLink.bind(this.game));

  socket.on("viewResults", this.results.show.bind(this.results));

  socket.on("showWaitingList", this.waiting.show.bind(this.waiting));

  socket.on(
    "updateWaitingList",
    this.waiting.updateWaitingList.bind(this.waiting)
  );

  socket.on("replacePlayer", this.replace.show.bind(this.replace));
};

Drawphone.prototype.begin = function() {
  this.mainMenu.show();
};

var socket = openSocket({ autoConnect: false });

//try to join the dev game
var relativeUrl = window.location.pathname + window.location.search;

if (relativeUrl === "/dev") {
  socket.open();
  socket.emit("joinGame", {
    code: "ffff",
    name: Math.random()
      .toString()
      .substring(2, 6)
  });
}

var drawphone = new Drawphone();
drawphone.initializeAll();
drawphone.begin();

if (relativeUrl === "/archive") {
  renderArchive();
}

async function renderArchive() {
  var archive = $("#archive");
  var archiveContent = $("#archive-content");
  var result = $("#result");
  if (!localStorage) {
    archiveContent.text("This browser does not support local storage.");
    return;
  }

  var resultsList = (await getResultsListFromStorage()).reverse();

  if (resultsList.length === 0) {
    archiveContent.text("No results found on this device. Play a game first!");
    return;
  }

  var lastDate;
  for (var i = 0; i < resultsList.length; i++) {
    var results = resultsList[i];

    var theDate = new Date(results.date).toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    if (theDate !== lastDate) {
      if (i > 0) archiveContent.append("<br>");
      archiveContent.append(theDate);

      lastDate = theDate;
    }

    var button = $(
      '<button type="button">' +
        getQuickInfoStringOfResults(results) +
        "</button>"
    );
    button.addClass("btn btn-default prevresbtn");

    (function(chains) {
      button.click(function() {
        drawphone.results.show(
          {
            data: { chains },
            you: { id: "this id doesn't exist" }
          },
          true
        );

        result.show();
        archive.hide();

        //jump to top of the page
        window.scrollTo(0, 0);
      });
    })(results.chains);
    archiveContent.append(button);
  }

  drawphone.results.onDoneViewingResults = function() {
    archive.show();
    result.hide();

    //jump to top of the page
    window.scrollTo(0, 0);
  };
}

function getQuickInfoStringOfResults(results) {
  var result = "";
  result += new Date(results.date).toLocaleTimeString("en-us", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  result += ": ";

  var firstChainLinks = results.chains[0].links;
  result += firstChainLinks[0].data;
  result += " to ";
  result += firstChainLinks[firstChainLinks.length - 1].data;

  if (results.chains.length === 1) return result;

  result += ", ";
  var secondChainLinks = results.chains[1].links;
  result += secondChainLinks[0].data;
  result += " to ";
  result += secondChainLinks[secondChainLinks.length - 1].data;
  result += ", etc.";
  return result;
}

function getResultsListFromStorage() {
  var db = initArchiveDb();
  return db.archive.toArray();
}

function initArchiveDb() {
  var db = new Dexie("DrawphoneDatabase");
  db.version(1).stores({
    archive: "++id,date,chains"
  });
  return db;
}
