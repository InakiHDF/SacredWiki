import React, { useState, useMemo } from 'react';

interface PokemonSpriteProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  pokemonName: string;
}

export default function PokemonSprite({ pokemonName, ...props }: PokemonSpriteProps) {
  const [spriteState, setSpriteState] = useState(0);

  const urlsToTry = useMemo(() => {
    const norm = pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const urls = [
      `https://play.pokemonshowdown.com/sprites/gen5ani/${norm}.gif`,
      `https://play.pokemonshowdown.com/sprites/xyani/${norm}.gif`,
      `https://play.pokemonshowdown.com/sprites/gen5/${norm}.png`
    ];

    if (pokemonName.includes('-')) {
      const baseNorm = pokemonName.split('-')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      urls.push(`https://play.pokemonshowdown.com/sprites/gen5ani/${baseNorm}.gif`);
      urls.push(`https://play.pokemonshowdown.com/sprites/xyani/${baseNorm}.gif`);
      urls.push(`https://play.pokemonshowdown.com/sprites/gen5/${baseNorm}.png`);
    }

    return urls;
  }, [pokemonName]);

  // If the component gets a new pokemonName, reset the fallback state
  React.useEffect(() => {
    setSpriteState(0);
  }, [pokemonName]);

  const currentSrc = urlsToTry[spriteState];

  return (
    <img
      {...props}
      src={currentSrc}
      onError={(e) => {
        if (spriteState < urlsToTry.length - 1) {
          setSpriteState(s => s + 1);
        } else if (props.onError) {
          props.onError(e);
        }
      }}
    />
  );
}
