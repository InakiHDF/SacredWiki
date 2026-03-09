const fs = require('fs');

async function fetchItems() {
  try {
    const res = await fetch('https://play.pokemonshowdown.com/data/items.js');
    const text = await res.text();
    
    // Extract the JSON object from `exports.BattleItems = { ... };`
    const match = text.match(/exports\.BattleItems\s*=\s*(\{[\s\S]*?});/);
    if (!match) throw new Error("Could not parse BattleItems");
    
    // Use eval or clean regex, it's safe since it's showdown data
    // We'll just eval it
    const data = eval('(' + match[1] + ')');
    
    const validItems = [];
    for (const key in data) {
      const item = data[key];
      
      if (item.gen > 8) continue;
      if (item.isNonstandard) continue;
      if (item.zMove) continue;
      if (item.megaStone) continue;
      
      validItems.push(item.name);
    }
    
    validItems.sort();
    fs.writeFileSync('./src/data/items.json', JSON.stringify(validItems, null, 2));
    console.log('Saved ' + validItems.length + ' items.');
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

fetchItems();
