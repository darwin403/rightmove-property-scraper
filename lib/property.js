const Promise = require("bluebird");
const uniqBy = require("lodash/uniqBy");
const cloneDeep = require("lodash/cloneDeep");

const fetch = require("./fetch");
const { CONCURRENCY } = require("../config");
const { log, range } = require("../utils");
const { stopwordInProperty } = require("./stopwords");
const { stopwords } = require("./load");

async function fetchOneProperties(
  identifier,
  propertyType,
  bedrooms,
  offset,
  listingType
) {
  let url;

  // endpoints for different listing types
  if (listingType === "BUY") {
    url = `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&maxBedrooms=${bedrooms}&minBedrooms=${bedrooms}&numberOfPropertiesPerPage=24&radius=0.0&sortType=1&viewType=LIST&channel=${listingType}&propertyTypes=${propertyType}&index=${offset}`;
  }

  if (listingType === "RENT") {
    url = `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&maxBedrooms=${bedrooms}&minBedrooms=${bedrooms}&numberOfPropertiesPerPage=24&radius=0.0&sortType=6&includeLetAgreed=true&viewType=LIST&channel=${listingType}&propertyTypes=${propertyType}&index=${offset}`;
  }

  return fetch(url, { type: "json", fields: ["properties", "resultCount"] });
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

      const allProperties = [...firstProperties];

      // return promise all properties fetch
      return Promise.map(
        chunks,
        function (offset) {
          return fetchOneProperties(
            identifier,
            propertyType,
            bedrooms,
            offset,
            listingType
          )
            .then((z) => {
              allProperties.push(z["properties"]);
            })
            .catch((err) => err);
        },
        { concurrency: CONCURRENCY.pages }
      )
        .then(() => uniqBy(allProperties, "id"))
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
