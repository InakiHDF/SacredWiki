import React from "react";
import trainersData from "@/data/trainers.json";
import PokemonSprite from "./PokemonSprite";
import { typeColors } from "@/lib/utils";
import { Swords, ShieldAlert } from "lucide-react";

interface TrainersViewProps {
  database: Record<string, any>;
  onSelectPokemon: (name: string) => void;
}

export default function TrainersView({ database, onSelectPokemon }: TrainersViewProps) {
  return (
    <div className="flex flex-col gap-10">
      {trainersData.map((trainer: any, index: number) => (
        <div key={`${trainer.name}-${index}`} className="bg-[var(--panel)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg">
          
          {/* Header */}
          <div className="bg-[#1f1f22] p-4 flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3 mb-2 md:mb-0">
              <div className="p-2 bg-[var(--gold)]/20 rounded-full border border-[var(--gold)]/30">
                <Swords className="w-6 h-6 text-[var(--gold)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-100">{trainer.name}</h2>
                <p className="text-zinc-400 text-sm">Ace Level: {trainer.ace_level}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-900/50 px-4 py-2 rounded-lg">
               <ShieldAlert className="w-5 h-5 text-red-400" />
               <div>
                  <p className="text-xs text-red-300/80 font-bold uppercase tracking-wider leading-none mb-1">Level Cap</p>
                  <p className="text-xl font-black text-red-200 leading-none">{trainer.ace_level}</p>
               </div>
            </div>
          </div>

          {/* Pokemon Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {trainer.pokemon.map((p: any, pIdx: number) => {
              // Try to find the pokemon in the DB to get its types
              const dbEntry = Object.values(database).find((entry: any) => entry.name === p.name);
              const types = dbEntry ? dbEntry.types : [];

              return (
                <div 
                  key={pIdx} 
                  className="bg-[#121214] border border-[var(--border-color)] rounded-lg p-3 hover:border-[var(--gold)]/50 transition-colors cursor-pointer flex flex-col h-full relative overflow-hidden group"
                  onClick={() => onSelectPokemon(p.name)}
                >
                  {/* Top: Types + Level */}
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex gap-1 flex-wrap max-w-[60%]">
                      {types.length > 0 ? types.map((t: string) => (
                        <span 
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: typeColors[t] || '#777' }}
                        >
                          {t}
                        </span>
                      )) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider bg-zinc-600">
                          Unknown
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                       <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Level</span>
                       <span className="text-lg font-black text-white leading-none block">{p.level}</span>
                    </div>
                  </div>

                  {/* Center: Sprite and Info */}
                  <div className="flex items-center gap-3 mb-4 mt-2 relative z-10">
                    <div className="relative w-16 h-16 bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                       <PokemonSprite pokemonName={p.name} className="w-14 h-14 object-contain pixelated" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-zinc-100">{p.name}</h3>
                       <div className="text-xs text-zinc-400 mt-1 line-clamp-1">
                          <span className="text-blue-300 font-medium">{p.ability || "Unknown Ability"}</span>
                          {p.item && (
                            <>
                              <span className="mx-1.5 opactiy-50">•</span>
                              <span className="text-emerald-300 flex items-center inline-flex gap-1">
                                {p.item}
                              </span>
                            </>
                          )}
                       </div>
                    </div>
                  </div>

                  {/* Decorative background number */}
                  <div className="absolute -bottom-4 right-2 text-8xl font-black text-zinc-800/20 z-0 select-none pointer-events-none">
                     {pIdx + 1}
                  </div>

                  <div className="mt-auto space-y-3 relative z-10">
                    {/* EVs and Nature */}
                    {(p.evs || p.nature) && (
                       <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/80 p-2 rounded-md border border-zinc-800">
                          {p.evs && (
                            <div>
                               <span className="text-zinc-500 font-medium block">EVs/IVs</span>
                               <span className="text-zinc-300 font-bold">{p.evs}</span>
                            </div>
                          )}
                          {p.nature && (
                            <div>
                               <span className="text-zinc-500 font-medium block">Nature</span>
                               <span className="text-purple-300 font-bold">{p.nature}</span>
                            </div>
                          )}
                       </div>
                    )}
                    
                    {/* Moves */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {p.moves.map((m: string, mIdx: number) => (
                         <div key={mIdx} className="bg-zinc-800 p-1.5 rounded text-xs font-semibold text-zinc-200 border border-zinc-700 truncate text-center hover:bg-zinc-700 transition-colors">
                            {m}
                         </div>
                      ))}
                      {/* Fill empty move slots */}
                      {Array.from({ length: Math.max(0, 4 - p.moves.length) }).map((_, emptyIdx) => (
                         <div key={`empty-${emptyIdx}`} className="bg-zinc-800/30 p-1.5 rounded text-xs font-semibold text-zinc-600 border border-zinc-800 border-dashed text-center">
                            -
                         </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
