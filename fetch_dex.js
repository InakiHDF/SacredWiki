const fs = require('fs');

async function fetchGalarDex() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokedex/galar/');
    const data = await res.json();
    const names = data.pokemon_entries.map(e => e.pokemon_species.name);
    fs.writeFileSync('./src/data/galar_dex.json', JSON.stringify(names, null, 2));
    console.log('Saved ' + names.length + ' Galar pokemon.');
    
    // Also fetch showroom items for the Item selector
    const itemsRes = await fetch('https://play.pokemonshowdown.com/data/items.json');
    const itemsData = await itemsRes.json();
    const itemNames = Object.values(itemsData).map(i => i.name).filter(Boolean);
    fs.writeFileSync('./src/data/items.json', JSON.stringify(itemNames, null, 2));
    console.log('Saved ' + itemNames.length + ' items.');

  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

fetchGalarDex();
