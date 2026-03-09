"use client";

import React, { useState } from 'react';
import { useTeam } from '@/hooks/useTeam';
import TeamPokemonCard from './TeamPokemonCard';

export default function TeamBuilder({ teamHook, onSelectPokemon }: { teamHook: ReturnType<typeof useTeam>; onSelectPokemon: (name: string) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'box' | 'graveyard'>('box');

  const displayList = activeSubTab === 'box' ? teamHook.aliveTeam : teamHook.graveyard;

  if (!teamHook.isLoaded) {
    return (
      <div className="w-full flex justify-center py-20">
        <div className="text-zinc-400 text-lg animate-pulse">Loading Box Data...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-6 border-b border-[var(--border-color)] pb-2">
        <button
          onClick={() => setActiveSubTab('box')}
          className={`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeSubTab === 'box' 
              ? 'text-[var(--gold)] border-[var(--gold)] bg-[var(--gold)]/10' 
              : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          Live Box ({teamHook.aliveTeam.length})
        </button>
        <button
          onClick={() => setActiveSubTab('graveyard')}
          className={`text-lg font-bold px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
            activeSubTab === 'graveyard' 
              ? 'text-red-400 border-red-500 bg-red-900/20' 
              : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/50'
          }`}
        >
          Graveyard ({teamHook.graveyard.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayList.length === 0 ? (
          <div className="col-span-full p-16 text-center text-zinc-500 border-2 border-dashed border-zinc-700/50 rounded-xl bg-[var(--panel)]">
            {activeSubTab === 'box' 
              ? "Your box is empty. Go back to the Pokédex, open a Pokémon, and click 'Add to Box' to start building your team." 
              : "No Pokémon have fallen yet. Stay strong!"}
          </div>
        ) : (
          displayList.map(member => (
            <TeamPokemonCard 
              key={member.id}
              member={member}
              updateMember={teamHook.updatePokemon}
              removeMember={teamHook.removePokemon}
              killMember={activeSubTab === 'box' ? teamHook.killPokemon : undefined}
              reviveMember={activeSubTab === 'graveyard' ? teamHook.revivePokemon : undefined}
              isGraveyard={activeSubTab === 'graveyard'}
              onSelectPokemon={onSelectPokemon}
            />
          ))
        )}
      </div>
    </div>
  );
}
