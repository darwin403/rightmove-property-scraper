const Promise = require("bluebird");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const log = require("./utils/logger");
let { CONCURRENCY, TYPES, BEDROOMS } = require("./config");
const { loadIdentifiers, stopwords } = require("./lib/load");
const saveRows = require("./lib/excel");
const {
  fetchAllProperties,
  fetchLowestSaleProperty,
  statsOfProperties,
} = require("./lib/property");

async function start() {
  log.info("bot started!");

  const locationIdentifiers = await loadIdentifiers();
  const postcodes = Object.keys(locationIdentifiers);

  log.info(`postcodes loaded: ${Object.keys(locationIdentifiers).length} valid postcodes`);
  log.info(`stopwords loaded: ${stopwords.length} stopwords`);

  const rows = [];

  await Promise.map(
    postcodes,
    async (postcode) => {
      log.info(`[${postcode}] fetching ...`);
      const locationIdentifier = locationIdentifiers[postcode];
      const allProperties = await fetchAllProperties(
        locationIdentifier,
        "",
        "",
        "RENT"
      );

      let totalStats = statsOfProperties(allProperties);

      let rowPinData = {
        postcode: postcode,
        totalLetAverage: totalStats.letAveragePrice,
        totalRentCount: totalStats.rentCount,
        totalLetCount: totalStats.letCount,
        totalLetPercentage: totalStats.letPercentage,
      };

      log.info(`[${postcode}] total stats: ${Object.values(totalStats).join(",")}`);

      return Promise.map(
        TYPES,
        (t) => {
          return Promise.map(
            BEDROOMS,
            async (b) => {
              const tbProperties = await fetchAllProperties(
                locationIdentifier,
                t.propertyType,
                b,
                "RENT"
              );
              const tbStats = statsOfProperties(tbProperties);
              log.info(
                `[${postcode}] type: ${
                  t.name
                }, bedrooms: ${b}, stats: ${Object.values(tbStats).join(",")}`
              );

              const tbSaleLowest = await fetchLowestSaleProperty(
                locationIdentifier,
                t.propertyType,
                b
              );
              log.info(
                `[${postcode}] type: ${t.name}, bedrooms: ${b}, lowest: ${tbSaleLowest}`
              );

              rowPinData = {
                ...rowPinData,
                [`${t.key}${b}LetAverage`]: tbStats.letAveragePrice,
                [`${t.key}${b}RentCount`]: tbStats.rentCount,
                [`${t.key}${b}LetCount`]: tbStats.letCount,
                [`${t.key}${b}LetPercentage`]: tbStats.letPercentage,
                [`${t.key}${b}SaleLowest`]: tbSaleLowest,
              };
            },
            { concurrency: CONCURRENCY.bedrooms }
          )
            .then(() => {
              log.info(
                `[${postcode}] type: ${t.name}, bedrooms (${BEDROOMS.join(
                  ","
                )}): all done.`
              );
            })
            .catch((err) => {
              log.error(
                `[${postcode}] type: ${t.name}, bedrooms (${BEDROOMS.join(
                  ","
                )}): failed: ${err.stack}`
              );
            });
        },
        { concurrency: CONCURRENCY.propertyTypes }
      )
        .then(() => {
          rows.push(rowPinData);
          log.info(
            `[${postcode}] types (${TYPES.map((i) => i.name).join(",")}): all done.`
          );
        })
        .catch((err) => {
          log.error(
            `[${postcode}] types (${TYPES.map((i) => i.name).join(",")}): failed: ${
              err.stack
            }`
          );
        });
    },
    { concurrency: CONCURRENCY.postcodes }
  )
    .then(() => {
      log.info("saving data to file");
    })
    .catch((err) => {
      log.error(`postcodes promise failed: ${err.stack}`);
    })
    .finally(async function () {
      // save rows
      await saveRows(rows);

      // pause program for .exe close
      readline.question("Press any key to continue ...", () => {
        readline.close();
      });
    });
}

start();
