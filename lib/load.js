const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const fetch = require("./fetch");
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

async function fetchIdentifier(postcode) {
  let identifier = null;
  let hasResults = false;

  try {
    const html = await fetch(
      `https://www.rightmove.co.uk/property-for-sale/search.html?searchLocation=${postcode}`,
      { type: "text" }
    );
    const $ = cheerio.load(html);
    identifier = $("input#locationIdentifier").val() || null;

    log.info(`[${postcode}] fetched locationIdentifier`);
  } catch (err) {
    log.error(`[${postcode}] fetched locationIdentifier failed`);
  }

  // check if identifier has rent results
  try {
    await fetch(
      `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&channel=RENT`,
      { type: "text" }
    );

    hasResults = true;
  } catch {}

  // check if identifier has sale results
  if (!hasResults) {
    try {
      await fetch(
        `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&channel=BUY`,
        { type: "text" }
      );

      hasResults = true;
    } catch {}
  }

  if (hasResults) {
    log.info(`[${postcode}] locationIdentifier has results.`);
  } else {
    log.info(`[${postcode}] locationIdentifier has no results.`);
  }

  return hasResults ? identifier : null;
}

async function loadIdentifiers(file, givenPostCodes) {
  const postcodes = [...givenPostCodes];

  if (postcodes.length === 0) {
    log.error("no postcodes provided.");
    return {};
  }

  let locationIdentifiers = {};
  let savedLocationIdentifiers = {};

  if (fs.existsSync(file)) {
    const contents = fs.readFileSync(file, { encoding: "utf8" });
    savedLocationIdentifiers = JSON.parse(contents);
    for (postcode in savedLocationIdentifiers) {
      const index = postcodes.indexOf(postcode);

      if (index === -1) continue;

      postcodes.splice(index, 1);

      if (!savedLocationIdentifiers[postcode]) continue;

      locationIdentifiers[postcode] = savedLocationIdentifiers[postcode];
    }
  }

  if (postcodes.length === 0) return locationIdentifiers;

  log.info("new postcodes found.");

  await Promise.map(
    postcodes,
    (postcode) => {
      return fetchIdentifier(postcode).then((identifier) => {
        locationIdentifiers[postcode] = identifier;
      });
    },
    { concurrency: 20 }
  )
    .then(() => {
      log.info("required identifiers fetched.");
    })
    .catch((err) => {
      log.error(`fetchIdentifiers map promise failed: ${err.message}`);
      log.debug(`fetchIdentifiers map promise failed: ${err.stack}`);
    });

  // write new identifiers to file
  let newLocationIdentifiers = { ...savedLocationIdentifiers };

  postcodes.forEach(function (postcode) {
    newLocationIdentifiers[postcode] = locationIdentifiers[postcode];
  });

  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      log.error(`locationIdentifiers dir create failed: ${err.message}`);
      log.debug(`locationIdentifiers dir create failed: ${err.stack}`);
    }
  }

  try {
    fs.writeFileSync(file, JSON.stringify(newLocationIdentifiers));
  } catch (err) {
    log.error(`locationIdentifiers file save failed: ${err.message}`);
    log.debug(`locationIdentifiers file save failed: ${err.stack}`);
  }

  log.info("new locationIdentifiers saved.");

  // remove nulled identifiers
  for (l in locationIdentifiers) {
    if (locationIdentifiers[l] === null) {
      delete locationIdentifiers[l];
    }
  }

  return locationIdentifiers;
}

const stopwordsFile = path.resolve(process.cwd(), "stopwords.txt");
const stopwords = readLines(stopwordsFile).map((i) => i.toLowerCase());

const postcodesFile = path.resolve(process.cwd(), "postcodes.txt");
const postcodes = readLines(postcodesFile);

const identifiersFile = path.resolve(
  process.cwd(),
  "dumps/locationIdentifiers.json"
);

module.exports = {
  stopwords,
  loadIdentifiers: async () => loadIdentifiers(identifiersFile, postcodes),
};
