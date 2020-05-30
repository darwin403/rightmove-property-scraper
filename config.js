const TIMEOUT = 7000;
const MAX_ATTEMPTS = 5;

const CONCURRENCY = {
  postcodes: 2,
  propertyTypes: 3,
  bedrooms: 2,
  pages: 3,
};

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

const BEDROOMS = [1, 2, 3, 4, 5, 6, 7, 8];

module.exports = {
  TIMEOUT,
  MAX_ATTEMPTS,
  CONCURRENCY,
  TYPES,
  BEDROOMS,
};
