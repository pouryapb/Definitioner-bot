const fetch = require("node-fetch");

const wordsApi = async (word) => {
  console.log("IN WORDSAPI!");
  fetch(
    "https://www.wordsapi.com/mashape/words/" +
      word +
      "?when=2021-02-01T13:30:10.197Z&encrypted=8cfdb18be722919bea9007beec58bdb9aeb12d0931f690b8"
  ).then((res) => {
    if (res.status === 404) {
      console.log("404 ERROR IN WORDSAPI!");
      return null;
    }
    console.log("NO ERROR IN WORDSAPI!");
    return res.json();
  });
};

module.exports = wordsApi;
