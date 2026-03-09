"use client";

import React, { useMemo } from 'react';
import { TeamPokemon } from '@/hooks/useTeam';
import db from '@/data/database.json';
import { typeColors, getSpriteUrl, getAnimSpriteUrl, getStatColor } from '@/lib/utils';
import { Skull, Trash2, ArrowUpCircle, RotateCcw } from 'lucide-react';

interface TeamPokemonCardProps {
  member: TeamPokemon;
  updateMember: (id: string, updates: Partial<TeamPokemon>) => void;
  removeMember: (id: string) => void;
  killMember?: (id: string) => void;
  reviveMember?: (id: string) => void;
  isGraveyard?: boolean;
}

export default function TeamPokemonCard({ 
  member, 
  updateMember, 
  removeMember, 
  killMember, 
  reviveMember, 
  isGraveyard = false 
}: TeamPokemonCardProps) {
  
  const dbAccess = db as Record<string, any>;
  
  // Find the pokemon data
  const pkmnData = useMemo(() => {
    return Object.values(dbAccess).find(
      (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === member.pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
  }, [member.pokemonName, dbAccess]);

  if (!pkmnData) {
    return <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-white">Error loading {member.pokemonName}</div>;
  }

  const data = pkmnData.augmented || pkmnData.vanilla;
  const types = pkmnData.types;
  const stats = data.stats;
  const bst = stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe;

  // Gather allowed abilities
  const allowedAbilities = useMemo(() => {
    const abilities: string[] = [];
    Object.entries(data.abilities).forEach(([key, ab]) => {
      if (typeof ab === 'string' && !abilities.includes(ab)) abilities.push(ab);
    });
    return abilities;
  }, [data.abilities]);

  // Gather allowed moves
  const allowedMoves = useMemo(() => {
    const moveSet = new Set<string>();
    const hasMoves = data.moves && Object.keys(data.moves.levelUp || {}).length > 0;
    const movesSource = hasMoves ? data.moves : pkmnData.vanilla.moves;

    if (movesSource) {
      if (movesSource.levelUp) Object.values(movesSource.levelUp).forEach((arr: any) => arr.forEach((m: string) => moveSet.add(m)));
      if (movesSource.tm_tr) movesSource.tm_tr.forEach((m: string) => moveSet.add(m));
      if (movesSource.egg) movesSource.egg.forEach((m: string) => moveSet.add(m));
      if (movesSource.tutor) movesSource.tutor.forEach((m: string) => moveSet.add(m));
    }
    return Array.from(moveSet).sort();
  }, [data, pkmnData]);

  // Gather possible evolutions
  const possibleEvos = useMemo(() => {
    const evos: {name: string, method: string}[] = [];
    if (pkmnData.vanilla.evos && pkmnData.vanilla.evos.length > 0) {
      pkmnData.vanilla.evos.forEach((evoKey: string) => {
        const evoData = Object.values(dbAccess).find(
          (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === evoKey.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (evoData) {
          const method = evoData.vanilla.evoType || (evoData.vanilla.evoLevel ? `Level ${evoData.vanilla.evoLevel}` : 'Method');
          evos.push({ name: evoData.name, method });
        }
      });
    }
    return evos;
  }, [pkmnData, dbAccess]);

  const roles = ["Physical Sweeper", "Special Sweeper", "Mixed Sweeper", "Physical Wall", "Special Wall", "Mixed Wall", "Pivot", "Cleric", "Hazard Setter", "Hazard Remover", "Trapper", "Unassigned"];

  const StatBar = ({ label, value }: { label: string, value: number }) => {
    const widthPercentage = Math.min((value / 255) * 100, 100);
    return (
      <div className="flex items-center gap-2 my-0.5 text-xs">
        <span className="w-6 font-bold text-zinc-400 text-right">{label}</span>
        <span className="w-6 font-mono text-zinc-200" style={{ color: getStatColor(value) }}>{value}</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ 
              width: `${widthPercentage}%`,
              backgroundColor: getStatColor(value)
            }}
          />
        </div>
      </div>
    );
  };

  const handleMoveChange = (index: number, value: string) => {
    const newMoves = [...member.moves] as [string, string, string, string];
    newMoves[index] = value;
    updateMember(member.id, { moves: newMoves });
  };

  return (
    <div className={`relative flex flex-col p-4 border rounded-xl overflow-hidden shadow-lg ${isGraveyard ? 'border-zinc-700 bg-zinc-900/80 grayscale' : 'border-[var(--border-color)] bg-[var(--panel)]'}`}>
      
      {/* Top Banner (Types) */}
      <div className="flex gap-1 absolute top-3 left-3">
        {types.map((t: string) => (
          <span 
            key={t} 
            className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow shadow-black uppercase"
            style={{ backgroundColor: typeColors[t] || '#777' }}
          >
            {t}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-start mt-6">
        <div className="flex-1">
          <input 
            type="text" 
            value={member.nickname || member.pokemonName}
            onChange={(e) => updateMember(member.id, { nickname: e.target.value })}
            placeholder="Nickname"
            className="text-xl font-bold bg-transparent border-none text-white focus:ring-0 focus:outline-none placeholder-zinc-600 mb-1 w-full"
            disabled={isGraveyard}
          />
          <span className="text-xs text-zinc-500 font-mono tracking-wider ml-1">BST {bst}</span>
        </div>
        <img 
          src={getAnimSpriteUrl(pkmnData.name)}
          onError={(e) => { 
            const target = e.currentTarget as HTMLImageElement;
            target.src = getSpriteUrl(pkmnData.name);
          }}
          className="w-16 h-16 object-contain pixelated drop-shadow-lg"
          alt={member.pokemonName}
        />
      </div>

      {/* Stats Block */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 mb-4 bg-zinc-800/40 p-2 rounded-lg border border-zinc-700/50">
        <div className="flex flex-col">
          <StatBar label="HP" value={stats.hp} />
          <StatBar label="ATK" value={stats.atk} />
          <StatBar label="DEF" value={stats.def} />
        </div>
        <div className="flex flex-col">
          <StatBar label="SPA" value={stats.spa} />
          <StatBar label="SPD" value={stats.spd} />
          <StatBar label="SPE" value={stats.spe} />
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid gap-2 text-sm z-10 relative">
        <div className="flex justify-between gap-2">
          {/* Role */}
          <select 
            value={member.role}
            onChange={(e) => updateMember(member.id, { role: e.target.value })}
            disabled={isGraveyard}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded p-1 focus:border-[var(--gold)] focus:ring-0"
          >
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Ability */}
          <select
            value={member.ability}
            onChange={(e) => updateMember(member.id, { ability: e.target.value })}
            disabled={isGraveyard}
            className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded p-1 focus:border-[var(--gold)] focus:ring-0"
          >
            <option value="">Select Ability...</option>
            {allowedAbilities.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Moves Context */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[0, 1, 2, 3].map(index => (
            <select
              key={index}
              value={member.moves[index]}
              onChange={(e) => handleMoveChange(index, e.target.value)}
              disabled={isGraveyard}
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded p-1 focus:border-[var(--gold)] focus:ring-0 truncate"
            >
              <option value="">- Move {index + 1} -</option>
              {allowedMoves.map(m => <option key={m} value={m}>{m.replace(/([A-Z])/g, ' $1').trim()}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Actions (Evolve, Kill, Delete) */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-800">
        <div className="flex gap-2">
          {/* Evolve Dropdown */}
          {!isGraveyard && possibleEvos.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  updateMember(member.id, { pokemonName: e.target.value, ability: '', moves: ['', '', '', ''] });
                  e.target.value = "";
                }
              }}
              value=""
              className="bg-zinc-800/80 hover:bg-zinc-700 text-green-400 border border-green-900/50 text-xs rounded p-1 focus:outline-none transition-colors max-w-[120px]"
            >
              <option value="">Evolve...</option>
              {possibleEvos.map(e => <option key={e.name} value={e.name}>{e.name} ({e.method})</option>)}
            </select>
          )}
        </div>

        <div className="flex gap-2">
          {isGraveyard ? (
            <button 
              onClick={() => reviveMember && reviveMember(member.id)}
              className="p-1.5 bg-zinc-800 hover:bg-green-900/50 text-zinc-400 hover:text-green-400 border border-zinc-700 hover:border-green-700 rounded transition-colors shadow-sm"
              title="Revive Pokémon"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => killMember && killMember(member.id)}
              className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-700 rounded transition-colors shadow-sm"
              title="Mark as Dead"
            >
              <Skull className="w-4 h-4" />
            </button>
          )}
          
          <button 
            onClick={() => removeMember(member.id)}
            className="p-1.5 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-white border border-zinc-700 hover:border-red-600 rounded transition-colors shadow-sm"
            title="Delete permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
