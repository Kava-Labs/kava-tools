const prices = require(`./prices`).prices;

var main = async () => {
  p = await prices.getCoinGeckoPrice('bnb:usd');
  console.log(p);
  p = await prices.getCoinGeckoPrice('bnb:usd:30');
  console.log(p);
  p = await prices.getBinancePrice('bnb:usd');
  console.log(p);
  p = await prices.getBinancePrice('bnb:usd:30');
  console.log(p);


  // swp - ascendex
  p = await prices.getAscendexPrice('swp:usd')
  console.log("swp:usd ", p)
  p = await prices.getAscendexPrice('swp:usd:30')
  console.log("swp:usd:30 ", p)

  // swp - kucoin
  p = await prices.getKuCoinPrice('swp:usd')
  console.log("swp:usd ", p)
  p = await prices.getKuCoinPrice('swp:usd:30')
  console.log("swp:usd:30 ", p)
};

main();
