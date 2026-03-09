export const typeColors: Record<string, string> = {
  Normal: "#A8A77A",
  Fire: "#EE8130",
  Water: "#6390F0",
  Electric: "#F7D02C",
  Grass: "#7AC74C",
  Ice: "#96D9D6",
  Fighting: "#C22E28",
  Poison: "#A33EA1",
  Ground: "#E2BF65",
  Flying: "#A98FF3",
  Psychic: "#F95587",
  Bug: "#A6B91A",
  Rock: "#B6A136",
  Ghost: "#735797",
  Dragon: "#6F35FC",
  Dark: "#705898",
  Steel: "#B7B7CE",
  Fairy: "#D685AD",
};

export const getTypeColor = (type: string) => typeColors[type] || "#ffffff";

export const getSpriteUrl = (name: string) => {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://play.pokemonshowdown.com/sprites/gen5/${norm}.png`;
};

export const getAnimSpriteUrl = (name: string) => {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `https://play.pokemonshowdown.com/sprites/gen5ani/${norm}.gif`;
};

export const getStatColor = (val: number) => {
  if (val < 50) return "#f87171"; // red-400
  if (val < 75) return "#fb923c"; // orange-400
  if (val < 100) return "#fbbf24"; // amber-400
  if (val < 120) return "#a3e635"; // lime-400
  return "#22c55e"; // green-500
};

export const getBstColor = (val: number) => {
  if (val < 300) return "#f87171"; 
  if (val < 400) return "#fb923c"; 
  if (val < 500) return "#fbbf24";
  if (val < 600) return "#a3e635";
  return "#22c55e";
};
