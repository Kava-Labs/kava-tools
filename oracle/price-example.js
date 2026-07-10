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
  p = await prices.getCoinGeckoPrice('akt:usd');
  console.log('akt:usd ', p);
  p = await prices.getCoinGeckoPrice('akt:usd:30');
  console.log('akt:usd:30 ', p);
};

main();
