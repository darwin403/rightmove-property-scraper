const fetch = require("node-fetch");
const cheerio = require("cheerio");

async function stopwordInProperty(property, stopwords) {
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
  let response;

  try {
    response = await fetch(
      "https://www.rightmove.co.uk" + property["propertyUrl"]
    );
  } catch (err) {
    log.warn('stopword check aborted')
    return false;
  }

  const html = await response.text();
  const $ = cheerio.load(html);

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

module.exports = { stopwordInProperty };
