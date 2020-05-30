const excel = require("exceljs");
const path = require("path");
const fs = require("fs");
const { TYPES, BEDROOMS } = require("../config");

const log = require("../utils/logger");

// user choice variables
const COLUMN_OFFSET = 0;
const OUTPUT_FILE = path.resolve(process.cwd(), "dumps/data.xlsx");

// base header keys
let columns = [
  { key: "postcode" },
  { key: "totalLetAverage" },
  { key: "totalRentCount" },
  { key: "totalLetCount" },
  { key: "totalLetPercentage" },
];

// populate header keys
TYPES.forEach((t) => {
  BEDROOMS.forEach((b) => {
    columns = columns.concat([
      { key: `${t.key}${b}LetAverage` },
      { key: `${t.key}${b}RentCount` },
      { key: `${t.key}${b}LetCount` },
      { key: `${t.key}${b}LetPercentage` },
      { key: `${t.key}${b}SaleLowest` },
    ]);
  });
});

// create excel instance
const wb = new excel.Workbook();
const ws = wb.addWorksheet("RightMove");
ws.columns = columns;

// create header for "Post Code"
ws.getCell(2, 1).value = "Post Code";

// create headers for "Per Property"
ws.mergeCells(1, 2, 1, 5);
ws.getCell(1, 2).value = "Per Property";
ws.getCell(1, 2).alignment = { horizontal: "center" };
ws.getCell(2, 2).value = `Total Average`;
ws.getCell(2, 3).value = `Total Rent`;
ws.getCell(2, 4).value = `Total Let`;
ws.getCell(2, 5).value = `Total % Let`;

// create headers for all types
TYPES.forEach((t, tIndex) => {
  const start = 6 + tIndex * (5 * BEDROOMS.length);
  const end = start + 5 * BEDROOMS.length - 1;
  ws.mergeCells(1, start, 1, end);
  ws.getCell(1, start).value = t.name;
  ws.getCell(1, start).alignment = { horizontal: "center" };
});

// create headers for all data
TYPES.forEach((t, tIndex) => {
  BEDROOMS.forEach((b, bIndex) => {
    const start = 6 + tIndex * (5 * BEDROOMS.length) + 5 * bIndex;
    ws.getCell(2, start).value = `${b} Average`;
    ws.getCell(2, start + 1).value = `${b} Rent`;
    ws.getCell(2, start + 2).value = `${b} Let`;
    ws.getCell(2, start + 3).value = `${b} % Let`;
    ws.getCell(2, start + 4).value = `${b} Lowest`;
  });
});

// save rows to excel file
async function saveRows(dataRows) {
  // sort results by postcodes
  dataRows.sort((a, b) => (a["postcode"] <= b["postcode"] ? -1 : 1));

  // push rows
  ws.addRows(dataRows);

  // attempt to create output file
  try {
    const output_dir = path.dirname(OUTPUT_FILE);

    // create output file's directories
    if (!fs.existsSync(output_dir)) {
      fs.mkdirSync(output_dir);
    }

    // write to excel file
    await wb.xlsx.writeFile(OUTPUT_FILE);

    log.info(`output save: success. saved ${dataRows.length} rows. all done!`);
  } catch (err) {
    log.error(`output save: failed. ${err.stack}`);
    createAttempts++;
  }
  log.info(`bot completed.`);
}

module.exports = saveRows;
