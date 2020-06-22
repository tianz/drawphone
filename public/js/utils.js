import Dexie from "dexie";

import * as constants from "./constants";

export const showElement = function(selector) {
  $(selector).removeClass(constants.HIDDEN);
};

export const getResultsListFromStorage = function() {
  const db = initArchiveDb();
  return db.archive.toArray();
};

export const addResultsToStorage = function(chains) {
  const db = initArchiveDb();
  db.archive.add({ date: new Date(), chains });
};

function initArchiveDb() {
  const db = new Dexie("DrawphoneDatabase");
  db.version(1).stores({
    archive: "++id,date,chains"
  });
  return db;
}
