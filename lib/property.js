const Promise = require("bluebird");
const fetch = require("node-fetch");
const uniqBy = require("lodash/uniqBy");
const cloneDeep = require("lodash/cloneDeep");
const dns = require("dns");

const { log, range } = require("../utils");
const { stopwordInProperty } = require("./stopwords");
const { stopwords } = require("./load");

function isOnline() {
  return new Promise(function (resolve, reject) {
    dns.lookup("www.google.com", function (err) {
      if (err && err.code == "ENOTFOUND") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function fetchOneProperties(
  identifier,
  propertyType,
  bedrooms,
  offset,
  listingType
) {
  let url;
  let response;

  // endpoints for different listing types
  if (listingType === "BUY") {
    url = `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&maxBedrooms=${bedrooms}&minBedrooms=${bedrooms}&numberOfPropertiesPerPage=24&radius=0.0&sortType=6&viewType=LIST&channel=${listingType}&propertyTypes=${propertyType}&index=${offset}`;
  }

  if (listingType === "RENT") {
    url = `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&maxBedrooms=${bedrooms}&minBedrooms=${bedrooms}&numberOfPropertiesPerPage=24&radius=0.0&sortType=6&includeLetAgreed=true&viewType=LIST&channel=${listingType}&propertyTypes=${propertyType}&index=${offset}`;
  }

  // maximum attempts before next
  const maxAttempts = 5;
  let currentAttempts = 0;

  attempts: while (currentAttempts < maxAttempts) {
    let networkReady = false;

    // halt till connection established
    networkCheck: while (!networkReady) {
      networkReady = await isOnline();

      if (networkReady) break networkCheck;

      currentAttempts = 0;
      log.warn(
        "[fetch property] request halted. waiting for internet connection ..."
      );

      await Promise.delay(1000);
    }

    response = fetch(url)
      .then((response) => {
        // throw error if response is not 200
        if (response.status !== 200)
          throw new Error(`unexpected response status ${response.status}`);
        return response;
      })
      .then((response) => response.json())
      .then((response) => {
        // throw error if response schema does not match
        if (!response["resultCount"] || !response["properties"])
          throw new Error(`unexpected response schema`);
        return response;
      })
      .catch((err) => err);

    currentAttempts++;

    // hoist result
    const result = await response;

    // break attempts if response was success
    if (!(result instanceof Error)) {
      log.info("[fetch property] request success");
      break attempts;
    }

    // break attempts if max attempts reached
    if (currentAttempts >= maxAttempts) {
      log.error(`[fetch property] request failed: max attempts reached.`);
      log.error(`[fetch property] request failed: ${result.message}`);
      log.debug(`[fetch property] request failed: ${result.stack}`);
      break attempts;
    }
  }
  return response;
}

// fetchOneProperties("OUTCODE^155", "flat", 2, 0, "RENT");

function fetchAllProperties(identifier, propertyType, bedrooms, listingType) {
  return fetchOneProperties(identifier, propertyType, bedrooms, 0, listingType)
    .then((l) => {
      const firstProperties = l["properties"];
      const resultCount = parseInt(l["resultCount"].replace(/,/g, ""));
      const maxAllowedCount = 1000; // max results accessible imposed by website
      const totalCount =
        resultCount <= maxAllowedCount ? resultCount : maxAllowedCount;
      const chunks = range(24, totalCount, 24);

      return Promise.mapSeries(chunks, function (offset) {
        return fetchOneProperties(
          identifier,
          propertyType,
          bedrooms,
          offset,
          listingType
        )
          .then((z) => z["properties"])
          .catch((i) => []);
      })
        .then((paginateProperties) =>
          uniqBy(firstProperties.concat(paginateProperties.flat()), "id")
        )
        .catch((err) => {
          log.error(`[fetched properties] all combine failed: ${err.message}`);
          log.debug(`[fetched properties] all combine failed: ${err.stack}`);
          return [];
        });
    })
    .catch((err) => {
      log.error(`[fetched properties] first page failed: ${err.message}`);
      log.debug(`[fetched properties] first page failed: ${err.stack}`);
      return [];
    });
}

async function fetchLowestSaleProperty(identifier, propertyType, bedrooms) {
  const maxAllowedPages = 42; // the max allowed by server.
  let totalPages = maxAllowedPages; // set after first page response
  let currentPage = 1;

  let price = 0;

  pages: while (currentPage <= totalPages && currentPage <= maxAllowedPages) {
    let r;
    try {
      r = await fetchOneProperties(
        identifier,
        propertyType,
        bedrooms,
        (currentPage - 1) * 24,
        "BUY"
      );
    } catch (err) {
      break pages;
    }

    const resultCount = parseInt(r["resultCount"].replace(/,/g, ""));
    const properties = cloneDeep(r["properties"]);

    // sort by lowest property price (including featured)
    properties.sort((p1, p2) => p1["price"]["amount"] - p2["price"]["amount"]);

    properties: for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      let hasAStopword = false;

      try {
        hasAStopword = await stopwordInProperty(property, stopwords);
      } catch (err) {
        log.error(`stopword checked failed: ${err.message}`);
        log.debug(`stopword checked failed: ${err.stack}`);
        continue properties;
      }

      if (!hasAStopword) {
        price = property["price"]["amount"];
        break pages;
      }

      log.info(`stopword exists: ${property["propertyUrl"]}`);
    }

    currentPage += 1;
    totalPages = range(0, resultCount, 24).length;
  }

  return price;
}

function statsOfProperties(properties) {
  const rentProperties = properties;
  const letQualifier = (p) => p["displayStatus"] == "Let agreed";
  const letProperties = rentProperties.filter(letQualifier);

  const rentCount = rentProperties.length;
  const letCount = letProperties.length;

  const totalReducer = (k, p) => k + p["price"]["amount"];
  const letTotalPrice = letProperties.reduce(totalReducer, 0);
  const letAveragePrice =
    letCount !== 0 ? (letTotalPrice / letCount).toFixed(2) : 0;
  const letPercentage =
    rentCount !== 0 ? ((letCount / rentCount) * 100).toFixed(2) : 0;

  return { letAveragePrice, rentCount, letCount, letPercentage };
}

module.exports = {
  fetchOneProperties,
  fetchAllProperties,
  fetchLowestSaleProperty,
  statsOfProperties,
};
