const fs = require('fs');

async function fetchItems() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/item?limit=2000');
    const data = await res.json();
    const itemNames = data.results.map(i => i.name).sort();
    fs.writeFileSync('./src/data/items.json', JSON.stringify(itemNames, null, 2));
    console.log('Saved ' + itemNames.length + ' items.');
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

fetchItems();
