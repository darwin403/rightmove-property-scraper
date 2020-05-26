const Promise = require("bluebird");
const fetch = require("node-fetch");
const uniqBy = require("lodash/uniqBy");
const cloneDeep = require("lodash/cloneDeep");
const { log, range } = require("../utils");
const { stopwordInProperty } = require("./stopwords");
const { stopwords } = require("./load");

function fetchAProperty(identifier, propertyType, bedrooms, offset, type) {
  let url;
  if (type === "BUY") {
    url = `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&maxBedrooms=${bedrooms}&minBedrooms=${bedrooms}&numberOfPropertiesPerPage=24&radius=0.0&sortType=6&viewType=LIST&channel=${type}&propertyTypes=${propertyType}&index=${offset}`;
  } else {
    url = `https://www.rightmove.co.uk/api/_search?locationIdentifier=${identifier}&maxBedrooms=${bedrooms}&minBedrooms=${bedrooms}&numberOfPropertiesPerPage=24&radius=0.0&sortType=6&includeLetAgreed=true&viewType=LIST&channel=${type}&propertyTypes=${propertyType}&index=${offset}`;
  }

  return fetch(url)
    .then((response) => response.json())
    .then((response) => {
      if (!response["resultCount"] || !response["properties"])
        throw new Error(`unexpected property`);
      return response;
    })
    .catch((err) => {
      log.error(`fetch property failed: ${err.stack}`);
      throw new Error(err);
    });
}

function fetchAllProperties(identifier, propertyType, bedrooms, type) {
  return fetchAProperty(identifier, propertyType, bedrooms, 0, type)
    .then((l) => {
      const firstProperties = l["properties"];
      const resultCount = parseInt(l["resultCount"].replace(/,/g, ""));
      const maxAllowedCount = 1000; // max results accessible imposed by website
      const totalCount =
        resultCount <= maxAllowedCount ? resultCount : maxAllowedCount;
      const chunks = range(24, totalCount, 24);

      return Promise.mapSeries(chunks, function (offset) {
        return fetchAProperty(identifier, propertyType, bedrooms, offset, type)
          .then((z) => z["properties"])
          .catch((i) => []);
      })
        .then((paginateProperties) =>
          uniqBy(firstProperties.concat(paginateProperties.flat()), "id")
        )
        .catch((err) => {
          log.error(`fetched properties combine failed: ${err.stack}`);
          return [];
        });
    })
    .catch((err) => {
      log.error(`fetch property (first page) failed: ${err.stack}`);
      throw [];
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
      r = await fetchAProperty(
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
        log.error(`stopword checked failed: ${err.stack}`);
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

  const averageReducer = (k, p) => k + p["price"]["amount"];
  const letAveragePrice = letProperties.reduce(averageReducer, 0);
  const letPercentage =
    rentCount !== 0 ? ((letCount / rentCount) * 100).toFixed(2) : 0;

  return { letAveragePrice, rentCount, letCount, letPercentage };
}

module.exports = {
  fetchAProperty,
  fetchAllProperties,
  fetchLowestSaleProperty,
  statsOfProperties,
};
