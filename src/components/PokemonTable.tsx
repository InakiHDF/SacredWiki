import React from "react";
import { typeColors, getBstColor } from "@/lib/utils";
import { ViewMode } from "@/components/Navigation";
import PokemonSprite from "./PokemonSprite";

interface PokemonTableProps {
  pokemonList: any[];
  viewMode: ViewMode;
  onSelectPokemon: (pokemon: any) => void;
}

export default function PokemonTable({ pokemonList, viewMode, onSelectPokemon }: PokemonTableProps) {
  return (
    <div className="overflow-x-auto bg-[var(--panel)] border border-[var(--border-color)] rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-[var(--border-color)] text-sm table-fixed">
        <thead className="bg-[#1f1f22]">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-zinc-300 w-16">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-300 w-16 text-center">Sprite</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-300 w-32 md:w-40 truncate">Name</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-300 w-24 md:w-32">Types</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-300 w-32 md:w-48">Abilities</th>
            <th className="px-2 py-3 text-center font-semibold text-zinc-300 w-10 sm:w-12 cursor-pointer hover:text-white">HP</th>
            <th className="px-2 py-3 text-center font-semibold text-zinc-300 w-10 sm:w-12 cursor-pointer hover:text-white">Atk</th>
            <th className="px-2 py-3 text-center font-semibold text-zinc-300 w-10 sm:w-12 cursor-pointer hover:text-white">Def</th>
            <th className="px-2 py-3 text-center font-semibold text-zinc-300 w-10 sm:w-12 cursor-pointer hover:text-white">SpA</th>
            <th className="px-2 py-3 text-center font-semibold text-zinc-300 w-10 sm:w-12 cursor-pointer hover:text-white">SpD</th>
            <th className="px-2 py-3 text-center font-semibold text-zinc-300 w-10 sm:w-12 cursor-pointer hover:text-white">Spe</th>
            <th className="px-2 py-3 text-center font-semibold text-[var(--gold)] w-14 cursor-pointer hover:text-yellow-400">BST</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)] bg-[var(--panel)]">
          {pokemonList.map((p) => {
            const data = viewMode === "augmented" && p.augmented ? p.augmented : p.vanilla;
            const bst = data.stats.hp + data.stats.atk + data.stats.def + data.stats.spa + data.stats.spd + data.stats.spe;
            
            return (
              <tr 
                key={p.name} 
                onClick={() => onSelectPokemon(p)}
                className="hover:bg-zinc-700/50 cursor-pointer transition-colors"
                title={p.isChanged ? "This Pokémon has been changed in the patch." : ""}
              >
                <td className="px-4 py-2 whitespace-nowrap text-zinc-400 font-mono">
                  #{String(p.id).padStart(3, '0')}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center">
                  {/* Showdown Sprite API */}
                  <PokemonSprite 
                    pokemonName={p.name}
                    className="h-10 w-10 object-contain pixelated inline-block" 
                    loading="lazy" 
                  />
                </td>
                <td className="px-4 py-2 whitespace-nowrap font-medium text-zinc-100 flex items-center h-14 truncate">
                  <span className="truncate">{p.name}</span>
                  {p.isChanged && (
                    <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-900/50 text-indigo-300 rounded border border-indigo-700/50 flex-shrink-0">
                      Mod
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="flex gap-1.5 flex-wrap">
                    {p.types.map((t: string) => (
                      <span 
                        key={t} 
                        className="px-2 py-0.5 rounded text-xs font-medium text-white shadow-sm"
                        style={{ backgroundColor: typeColors[t] || '#777' }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-normal text-xs text-zinc-300 break-words leading-tight">
                  <div className="flex flex-col gap-0.5">
                    {Object.entries(data.abilities).reduce((acc: any[], [slot, ab]: [string, any]) => {
                       const isDup = acc.some(a => a.ab === ab && slot === 'H');
                       if (!isDup) acc.push({ slot, ab });
                       return acc;
                    }, []).map(({slot, ab}) => (
                      <span key={slot} className={slot === 'H' ? 'font-bold text-[var(--gold)]' : ''}>
                        {ab as string} {slot === 'H' && '(H)'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-2 py-2 text-center text-zinc-300">{data.stats.hp}</td>
                <td className="px-2 py-2 text-center text-zinc-300">{data.stats.atk}</td>
                <td className="px-2 py-2 text-center text-zinc-300">{data.stats.def}</td>
                <td className="px-2 py-2 text-center text-zinc-300">{data.stats.spa}</td>
                <td className="px-2 py-2 text-center text-zinc-300">{data.stats.spd}</td>
                <td className="px-2 py-2 text-center text-zinc-300">{data.stats.spe}</td>
                <td className="px-4 py-2 font-bold text-center" style={{ color: getBstColor(bst) }}>{bst}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pokemonList.length === 0 && (
        <div className="p-8 text-center text-zinc-400">
          No Pokémon found matching your criteria.
        </div>
      )}
    </div>
  );
}
