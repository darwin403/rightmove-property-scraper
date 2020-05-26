const Promise = require("bluebird");
const excel = require("exceljs");
const path = require("path");
const fs = require("fs");

const log = require("./utils/logger");
const { loadIdentifiers, stopwords } = require("./lib/load");

const {
  fetchAllProperties,
  fetchLowestSaleProperty,
  statsOfProperties,
} = require("./lib/property");

const OUTPUT_FILE = path.resolve(__dirname, "dumps/output.xlsx");

// create output file's directories
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
  try {
    fs.mkdirSync(dir);
  } catch (err) {
    log.error(`output dir create failed: ${err.stack}`);
  }
}

const CONCURRENCY = {
  pins: 2,
  propertyTypes: 3,
  bedrooms: 3,
};

const COLUMN_OFFSET = 0;
const BEDROOMS = [1, 2, 3, 4, 5, 6, 7, 8];
const TYPES = [
  {
    name: "Flat",
    propertyType: "flat",
    key: "f",
  },
  {
    name: "Terraced",
    propertyType: "terraced",
    key: "t",
  },
  {
    name: "Semi-Detached",
    propertyType: "semi-detached",
    key: "s",
  },
  {
    name: "Detached",
    propertyType: "detached",
    key: "d",
  },
  {
    name: "Bungalow",
    propertyType: "bungalow",
    key: "b",
  },
];

let COLUMNS = [
  { key: "pin", header: "Pin Code" },
  { key: "totalLetAverage", header: "Total Average" },
  { key: "totalRentCount", header: "Total Rent" },
  { key: "totalLetCount", header: "Total Let" },
  { key: "totalLetPercentage", header: "% Let" },
];

TYPES.forEach((t) => {
  BEDROOMS.forEach((b) => {
    COLUMNS = COLUMNS.concat([
      { key: `${t.key}${b}LetAverage`, header: `${b} Average` },
      { key: `${t.key}${b}RentCount`, header: `${b} Rent` },
      { key: `${t.key}${b}LetCount`, header: `${b} Let` },
      { key: `${t.key}${b}LetPercentage`, header: `${b} % Let` },
      { key: `${t.key}${b}SaleLowest`, header: `${b} Lowest` },
    ]);
  });
});

async function main() {
  log.info("bot started!");

  const locationIdentifiers = await loadIdentifiers();
  const pins = Object.keys(locationIdentifiers);

  log.info(`pins loaded: ${Object.keys(locationIdentifiers).length} pins`);
  log.info(`stopwords loaded: ${stopwords.length} stopwords`);

  // create excel file
  var wb = new excel.Workbook();
  var ws = wb.addWorksheet("RightMove");
  ws.columns = COLUMNS;

  const rows = [];

  await Promise.map(
    pins,
    async (pin) => {
      log.info(`[${pin}] fetching ...`);
      const locationIdentifier = locationIdentifiers[pin];
      const allProperties = await fetchAllProperties(
        locationIdentifier,
        "",
        "",
        "RENT"
      );

      let totalStats = statsOfProperties(allProperties);

      let rowPinData = {
        pin: pin,
        totalLetAverage: totalStats.letAveragePrice,
        totalRentCount: totalStats.rentCount,
        totalLetCount: totalStats.letCount,
        totalLetPercentage: totalStats.letPercentage,
      };

      log.info(`[${pin}] total stats: ${Object.values(totalStats).join(",")}`);

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
                `[${pin}] type: ${t.name} bedrooms: ${b} stats: ${Object.values(
                  tbStats
                ).join(",")}`
              );

              const tbSaleLowest = await fetchLowestSaleProperty(
                locationIdentifier,
                t.propertyType,
                b
              );
              log.info(
                `[${pin}] type: ${t.name} bedrooms: ${b} lowest: ${tbSaleLowest}`
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
                `[${pin}] type: ${t.name} bedrooms (${BEDROOMS.join(
                  ","
                )}): all done.`
              );
            })
            .catch((err) => {
              log.error(
                `[${pin}] type: ${t.name} bedrooms (${BEDROOMS.join(
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
            `[${pin}] types (${TYPES.map((i) => i.name).join(",")}): all done.`
          );
        })
        .catch((err) => {
          log.error(
            `[${pin}] types (${TYPES.map((i) => i.name).join(",")}): failed: ${
              err.stack
            }`
          );
        });
    },
    { concurrency: CONCURRENCY.pins }
  )
    .then(() => {
      log.info("saving data to file");
    })
    .catch((err) => {
      log.err(`pins promise failed: ${err.stack}`);
    })
    .finally(async function () {
      ws.addRows(rows);
      wb.xlsx
        .writeFile(OUTPUT_FILE)
        .then(function () {
          log.info(`saved ${rows.length} rows to file. all done!`);
          log.info(`bot completed.`);
        })
        .catch((err) => {
          log.error(`output save failed: ${err.stack}`);
        });
    });
}

main();
