import React, { useState } from 'react';

interface PokemonSpriteProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  pokemonName: string;
}

export default function PokemonSprite({ pokemonName, ...props }: PokemonSpriteProps) {
  // States: 
  // 0 -> gen5ani (custom 2D pixel animation)
  // 1 -> xyani (3D animation)
  // 2 -> gen5 (static 2D sprite)
  const [spriteState, setSpriteState] = useState(0);

  const norm = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');

  let currentSrc = '';
  if (spriteState === 0) {
    currentSrc = `https://play.pokemonshowdown.com/sprites/gen5ani/${norm}.gif`;
  } else if (spriteState === 1) {
    currentSrc = `https://play.pokemonshowdown.com/sprites/xyani/${norm}.gif`;
  } else {
    currentSrc = `https://play.pokemonshowdown.com/sprites/gen5/${norm}.png`;
  }

  return (
    <img
      {...props}
      src={currentSrc}
      onError={(e) => {
        if (spriteState < 2) {
          setSpriteState(s => s + 1);
        }
        // If the user provided their own onError, we could call it here, 
        // but for our purposes, state fallback handles it.
        if (props.onError && spriteState === 2) {
            props.onError(e);
        }
      }}
    />
  );
}
