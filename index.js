const fs = require("fs");
const fetch = require("node-fetch");
const Promise = require("bluebird");
const uniqBy = require("lodash/uniqBy");
const cheerio = require("cheerio");

const { log, range } = require("./utils");
let stopwords = require("./stopwords.json");

stopwords = stopwords.map((i) => i.toLowerCase());

log.info("Started");

function fetch_property(identifier, propertyType, bedrooms, offset, type) {
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
        throw new Error(`Unexpected response for: ${url}`);
      return response;
    });
}

function fetch_all_properties(identifier, propertyType, bedrooms, type) {
  return fetch_property(identifier, propertyType, bedrooms, 0, type).then(
    (l) => {
      const firstProperties = l["properties"];
      const total = parseInt(l["resultCount"].replace(/,/g, ""));
      const chunks = range(24, total, 24);

      return Promise.mapSeries(chunks, function (offset) {
        return fetch_property(
          identifier,
          propertyType,
          bedrooms,
          offset,
          type
        ).then((k) => k["properties"]);
      }).then((paginateProperties) =>
        firstProperties.concat(paginateProperties.flat())
      );
    }
  );
}

function gather_stats(rentProperties) {
  const letQualifier = (p) => p["displayStatus"] == "Let agreed";
  const letProperties = rentProperties.filter(letQualifier);

  const rentCount = rentProperties.length;
  const letCount = letProperties.length;

  const averageReducer = (k, p) => k + p["price"]["amount"];
  const letAveragePrice = letProperties.reduce(averageReducer, 0);
  const letPercentage =
    rentCount !== 0 ? ((letCount / rentCount) * 100).toFixed(2) : 0;

  return [letAveragePrice, rentCount, letCount, letPercentage];
}

async function propertyHasAStopword(property, stopwords) {
  // search summary
  if (stopwords.some((s) => property["summary"].toLowerCase().includes(s))) {
    return true;
  }

  // search display prices
  if (
    stopwords.some((s) => {
      const displayPrices = property["price"]["displayPrices"];
      for (let j = 0; j < displayPrices.length; j++) {
        const displayPriceQualifier = displayPrices[j]["displayPriceQualifier"];
        if (displayPriceQualifier.toLowerCase().includes(s)) return true;
      }
      return false;
    })
  ) {
    return true;
  }

  let foundOnPage = false;

  const response = await fetch(
    "https://www.rightmove.co.uk" + property["propertyUrl"]
  );
  const text = await response.text();
  const $ = cheerio.load(text);

  // search key features
  $("div.key-features > ul > li").each(function () {
    const keyFeature = $(this).text().toLowerCase();
    if (stopwords.some((s) => keyFeature.includes(s))) {
      foundOnPage = true;
    }
  });

  // search description
  const description = $('[itemprop="description"]').text();
  if (stopwords.some((s) => description.toLowerCase().includes(s))) {
    foundOnPage = true;
  }

  if (foundOnPage) {
    return true;
  }

  return false;
}

async function fetch_lowest_sale(identifier, propertyType, bedrooms) {
  let maxPages = 1000; // set after first page response
  let currentPage = 1;

  let price = 0;

  pages: while (currentPage <= maxPages) {
    const r = await fetch_property(
      identifier,
      propertyType,
      bedrooms,
      (currentPage - 1) * 24,
      "BUY"
    );

    const total = parseInt(r["resultCount"].replace(/,/g, ""));
    const pp = r["properties"];

    const properties = JSON.parse(JSON.stringify(pp));

    // sort by lowest property price (including featured)
    properties.sort((p1, p2) => p1["price"]["amount"] - p2["price"]["amount"]);

    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      const hasAStopword = await propertyHasAStopword(p, stopwords);
      if (!hasAStopword) {
        price = p["price"]["amount"];
        break pages;
      }
    }

    currentPage += 1;

    maxPages = range(0, total, 24).length;
  }

  return price;
}

const bedrooms = range(1, 5);
const types = [
  {
    name: "Flat",
    propertyType: "flat",
  },
  {
    name: "Terraced",
    propertyType: "terraced",
  },
  {
    name: "Semi-Detached",
    propertyType: "semi-detached",
  },
  {
    name: "Detached",
    propertyType: "detached",
  },
  {
    name: "Bungalow",
    propertyType: "bungalow",
  },
];

const identifiers = ["OUTCODE^155"];

Promise.map(
  identifiers,
  (i) => {
    fetch_all_properties(i, "", "", "RENT").then((properties) => {
      const stats = gather_stats(uniqBy(properties, "id"));
      console.log(`Indentifier: ${i} Stats:`, stats);
    });
    Promise.map(
      types,
      (t) => {
        Promise.map(bedrooms, async (b) => {
          fetch_all_properties(i, t.propertyType, b, "RENT").then(
            (properties) => {
              const stats = gather_stats(uniqBy(properties, "id"));
              console.log(`Type: ${t.name} Rooms: ${b} Stats:`, stats);
            },
            { concurrency: 3 }
          );
          const lowest = await fetch_lowest_sale(i, t.propertyType, b);
          console.log(`Type: ${t.name} Rooms: ${b} Lowest:`, lowest);
        });
      },
      { concurrency: 3 }
    );
  },
  { concurrency: 3 }
);
