const nodeFetch = require("node-fetch");
const AbortController = require("abort-controller");
const dns = require("dns");
const Promise = require("bluebird");

const { TIMEOUT, MAX_ATTEMPTS } = require("../config");
const log = require("../utils/logger");

class UnexpectedSchema extends Error {
  constructor(message) {
    super(message);
    this.name = "UnexpectedSchema";
  }
}

class UnexpectedStatus extends Error {
  constructor(message) {
    super(message);
    this.name = "UnexpectedStatus";
  }
}

function isOnline() {
  return new Promise(function (resolve) {
    dns.lookup("google.com", function (err) {
      if (err && err.code == "ENOTFOUND") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

async function fetch(url, schema) {
  let result;
  let currentAttempts = 0;

  attempts: while (currentAttempts < MAX_ATTEMPTS) {
    const controller = new AbortController();
    const signal = controller.signal;
    let networkReady = false;

    // halt till network connection
    networkCheck: while (!networkReady) {
      networkReady = await isOnline();
      if (networkReady) break networkCheck;

      // void all previous
      currentAttempts = 0;

      log.warn(`[fetch] request halted. waiting for internet connection ...`);
      await Promise.delay(3000);
    }

    // check timeout
    const timeoutCheck = setTimeout(() => {
      controller.abort();
    }, TIMEOUT);

    const response = nodeFetch(url, { signal })
      .then((response) => {
        // throw error if response is not 200
        if (response.status !== 200)
          throw new UnexpectedStatus(
            `Unexpected response status: ${response.status}.`
          );
        return response;
      })
      .then((response) => {
        if (schema.type === "json") return response.json();
        return response.text();
      })
      .then((response) => {
        if (schema.type === "json") {
          // throw error if response schema does not match
          schema.fields.forEach((f) => {
            if (!(f in response)) {
              throw new UnexpectedSchema(
                `Unexpected response schema: "${f}" does not exist.`
              );
            }
          });
        }
        return response;
      })
      .catch(async (err) => {
        if (err.name === "AbortError" || err.code === "ENOTFOUND") {
          // recheck if network up
          networkReady = await isOnline();
          if (!networkReady) {
            currentAttempts = 0;
          }
        } else {
          // increment attempt count
          currentAttempts++;
        }
        return err;
      })
      .finally(() => {
        clearTimeout(timeoutCheck);
      });

    // hoist result
    result = await response;

    // break attempts if max attempts reached
    if (currentAttempts >= MAX_ATTEMPTS) {
      // handle an error result

      if (
        result.name === "UnexpectedStatus" ||
        result.name === "UnexpectedSchema"
      ) {
        log.warn(`[fetch] request failed: ${url} ${result.message}`);
        throw result;
      }

      log.error(`[fetch] request failed: ${url} ${result.stack}`);
      throw result;
    }

    // break attempts if response was success
    if (!(result instanceof Error)) {
      // log.debug(`[fetch] request success: ${url}`);
      return result;
    }
  }

  return result;
}

// fetch(
//   "https://www.rightmove.co.uk/api/_search?locationIdentifier=OUTCODE^155&maxBedrooms=&minBedrooms=&numberOfPropertiesPerPage=24&radius=0.0&sortType=6&includeLetAgreed=true&viewType=LIST&channel=RENT&propertyTypes=&index=0",
//   { type: "json", fields: ["properties", "resultCoun"] }
// )
//   .then((a) => {
//     console.log(a["properties"].length);
//   })
//   .catch((err) => {console.log('HEEEEEEEEERE')});

module.exports = fetch;
