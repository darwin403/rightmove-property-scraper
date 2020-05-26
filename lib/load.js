const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const log = require("../utils/logger");

function readLines(file) {
  if (!fs.existsSync(file)) {
    log.error(`file not found at: ${file}`);
    return [];
  }

  try {
    const contents = fs.readFileSync(file, { encoding: "utf8" });
    return contents
      .split("\n")
      .map((i) => i.trim())
      .filter((i) => i);
  } catch (err) {
    log.error("read file failed:", file);
  }

  return [];
}

async function fetchIdentifier(pin) {
  try {
    const response = await fetch(
      `https://www.rightmove.co.uk/property-for-sale/search.html?searchLocation=${pin}`
    );
    const html = await response.text();
    const $ = cheerio.load(html);
    const identifier = $("input#locationIdentifier").val();

    log.info(`[${pin}] fetched locationIdentifier`);
    return identifier ? identifier : null;
  } catch (err) {
    log.error(`[${pin}] fetched locationIdentifier failed`);
    return null;
  }
}

async function loadIdentifiers(file, givenPins) {
  const pins = [...givenPins];

  if (pins.length === 0) {
    log.error("no pins provided.");
    return {};
  }

  let locationIdentifiers = {};
  let savedLocationIdentifiers = {};

  if (fs.existsSync(file)) {
    savedLocationIdentifiers = require(file);
    for (pin in savedLocationIdentifiers) {
      const index = pins.indexOf(pin);

      if (index === -1) continue;

      locationIdentifiers[pin] = savedLocationIdentifiers[pin];
      pins.splice(index, 1);
    }
  }

  if (pins.length === 0) return locationIdentifiers;

  log.info("new pins found.");

  await Promise.map(
    pins,
    function (pin) {
      return fetchIdentifier(pin).then((identifier) => {
        locationIdentifiers[pin] = identifier;
      });
    },
    { concurrency: 20 }
  )
    .then(() => {
      log.info("required identifiers fetched.");
    })
    .catch(log.error);

  // write new identifiers to file
  let newLocationIdentifiers = { ...savedLocationIdentifiers };

  pins.forEach(function (pin) {
    newLocationIdentifiers[pin] = locationIdentifiers[pin];
  });

  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      log.error(`locationIdentifiers dir create failed: ${err.stack}`);
    }
  }

  try {
    fs.writeFileSync(file, JSON.stringify(newLocationIdentifiers));
  } catch (err) {
    log.error(`locationIdentifiers file save failed: ${err.stack}`);
  }

  log.info("new locationIdentifiers saved.");

  // remove nulled identifiers
  for (l in locationIdentifiers) {
    if (!locationIdentifiers[l]) {
      delete locationIdentifiers[l];
    }
  }

  return locationIdentifiers;
}

const stopwordsFile = path.resolve(__dirname, "../stopwords.txt");
const stopwords = readLines(stopwordsFile);

const pinsFile = path.resolve(__dirname, "../pins.txt");
const pins = readLines(pinsFile);

const identifiersFile = path.resolve(
  __dirname,
  "../dumps/locationIdentifiers.json"
);

module.exports = {
  stopwords,
  loadIdentifiers: async () => loadIdentifiers(identifiersFile, pins),
};
