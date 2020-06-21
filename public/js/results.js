import Screen from "./screen";
import * as constants from "./constants";

Results.prototype = Object.create(Screen.prototype);

export default function Results(onDoneViewingResults, socket) {
  Screen.call(this);

  this.onDoneViewingResults = onDoneViewingResults;

  this.id = "#result";
  this.socket = socket;
}

Results.prototype.initialize = function() {
  var self = this;
  $("#result-done").on("click", function() {
    self.onDoneViewingResults();
  });
  // $("#result-save").on("click", function() {
  //   console.log("Saving...");
  //   function filter(node) {
  //     return node.id != "result-buttons" && node.type != "button";
  //   }
  //   let node = document.querySelector(".main-content");
  //   domtoimage
  //     .toBlob(node, {
  //       bgcolor: "white",
  //       quality: 1,
  //       filter: filter
  //     })
  //     .then(function(blob) {
  // let link = document.createElement('a');
  // link.download = 'drawphone.jpeg';
  // link.href = dataUrl;
  // link.click();
  // window.saveAs(blob, "drawphone.png");
  // });
  // html2canvas(document.querySelector('.main-content'), {
  // 	// scrollX: 0,
  // 	// scrollY: 0
  // 	scale: 32
  // }).then(canvas => {
  // 	let a = document.createElement('a');
  // 	a.href = canvas.toDataURL('image/png');
  // 	a.download = 'drawphone.png';
  // 	a.click();
  // });
  // });
};

Results.prototype.show = function(res, isArchivePage) {
  this.socket.off("disconnect");

  var chains = res.data.chains;
  var ourChain;
  for (var i = 0; i < chains.length; i++) {
    var chain = chains[i];
    if (chain.owner.id === res.you.id) {
      ourChain = chain;
      break;
    }
  }

  //if we don't own a chain, just show the first one
  if (ourChain) {
    this.render(ourChain, chains);
  } else {
    this.render(chains[0], chains);
  }

  Screen.prototype.show.call(this);

  if (!isArchivePage && !res.data.isViewPreviousResults) {
    addResultsToStorage(chains);
  }
};

Results.prototype.render = function(chainToShow, allChains) {
  Screen.prototype.setTitle.call(this, chainToShow.owner.name + "的传画记录");
  var subtitle = "";
  Screen.prototype.setSubtitle.call(this, subtitle);
  this.displayChain(chainToShow);
  this.displayOtherChainButtons(allChains, chainToShow);
};

Results.prototype.displayChain = function(chain) {
  var results = $("#result-content");
  results.empty();

  for (var i = 0; i < chain.links.length; i++) {
    var link = chain.links[i];
    if (i === 0 && link.type === constants.WORD) {
      results.append("<h3>The first word:</h3><h1>" + link.data + "</h1>");
    } else if (i === 1 && chain.links[0].type === constants.FIRST_WORD) {
      results.append(
        "<h3>" + link.player.name + "想要画一个:</h3><h1>" + link.data + "</h1>"
      );
    } else if (link.type === constants.DRAWING) {
      results.append(
        "<h3>" +
          link.player.name +
          '画了:</h3><img class="drawing" src="' +
          link.data +
          '"></img>'
      );
    } else if (link.type === constants.WORD) {
      results.append(
        "<h3>" + link.player.name + "觉得这是:</h3><h1>" + link.data + "</h1>"
      );
    }
  }

  var wentFromBox = "";
  wentFromBox += '<br><div class="well">';
  var firstIndex = chain.links[0].type === constants.FIRST_WORD ? 1 : 0;
  wentFromBox +=
    "<h4>最开始的:</h4><h2>" + chain.links[firstIndex].data + "</h2><br>";
  wentFromBox +=
    "<h4>最后变成了:</h4><h2>" +
    chain.links[chain.links.length - 1].data +
    "</h2>";
  wentFromBox += "</div>";
  results.append(wentFromBox);
};

Results.prototype.displayOtherChainButtons = function(
  chainsToList,
  chainToIgnore
) {
  var others = $("#result-others");
  others.empty();

  if (chainsToList.length > 1) {
    others.append("<h4>View more results:</h4>");
  }

  var self = this;
  for (var i = 0; i < chainsToList.length; i++) {
    var chain = chainsToList[i];

    //only make a button for the chain if it is not the one we are now displaying
    if (chain.id !== chainToIgnore.id) {
      var button = $(
        '<button type="button">' + chain.owner.name + "'s results</button>"
      );
      button.addClass("btn btn-default btn-lg");
      (function(thisChain, chainList) {
        button.click(function() {
          self.render(thisChain, chainList);

          //jump to top of the page
          window.scrollTo(0, 0);
        });
      })(chain, chainsToList);
      others.append(button);
    }
  }
};

function addResultsToStorage(chains) {
  var db = initArchiveDb();
  db.archive.add({ date: new Date(), chains });
}

function initArchiveDb() {
  var db = new Dexie("DrawphoneDatabase");
  db.version(1).stores({
    archive: "++id,date,chains"
  });
  return db;
}
