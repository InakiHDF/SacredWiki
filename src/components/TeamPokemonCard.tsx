"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { TeamPokemon } from '@/hooks/useTeam';
import db from '@/data/database.json';
import itemsRaw from '@/data/items.json';
import { typeColors, getSpriteUrl, getAnimSpriteUrl, getStatColor } from '@/lib/utils';
import { Skull, Trash2, RotateCcw, ExternalLink, ChevronDown } from 'lucide-react';

const itemsList: string[] = (itemsRaw as string[]).sort();

interface TeamPokemonCardProps {
  member: TeamPokemon;
  updateMember: (id: string, updates: Partial<TeamPokemon>) => void;
  removeMember: (id: string) => void;
  killMember?: (id: string) => void;
  reviveMember?: (id: string) => void;
  isGraveyard?: boolean;
}

// Category mapping
const categoryImages: Record<string, string> = {
  Physical: 'https://play.pokemonshowdown.com/sprites/categories/Physical.png',
  Special:  'https://play.pokemonshowdown.com/sprites/categories/Special.png',
  Status:   'https://play.pokemonshowdown.com/sprites/categories/Status.png',
};

interface MoveData {
  name: string;
  type: string;
  category: string;
  basePower: number;
  accuracy: number | true;
  pp: number;
}

// A single selected move displayed as a rich card
function MoveCard({ move, onClear }: { move: MoveData; onClear: () => void }) {
  const typeColor = typeColors[move.type] || '#777';
  const catImg = categoryImages[move.category] || categoryImages['Status'];

  return (
    <div 
      className="flex flex-col p-2 flex-1 min-w-0 group relative overflow-hidden rounded-lg border-2"
      style={{
        backgroundColor: `${typeColor}40`, // 25% opacity
        borderColor: typeColor,
      }}
    >
      <div className="flex items-center justify-between min-w-0 w-full px-0.5">
        <span className="text-zinc-100 font-bold text-[14px] truncate drop-shadow-sm">{move.name}</span>
        <div className="flex items-center gap-2 shrink-0 ml-1">
          {move.basePower > 0 && (
            <span className="text-zinc-100 text-[12px] font-bold flex items-center gap-0.5" title="Base Power">
              <svg className="w-3.5 h-3.5 text-zinc-100 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path><path d="M6.5 9.5L9.5 6.5"></path></svg>
              {move.basePower}
            </span>
          )}
          {move.accuracy !== undefined && (
            <span className="text-zinc-200 text-[12px] font-medium flex items-center gap-0.5" title="Accuracy">
              <svg className="w-3 h-3 text-zinc-200 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
              {move.accuracy === true ? '-' : move.accuracy}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-1 px-0.5">
        <img src={catImg} alt={move.category} className="h-[14px] w-auto pixelated opacity-90 drop-shadow-sm" />
      </div>
      
      <button
        onClick={onClear}
        className="absolute right-1 top-1.5 text-zinc-400 hover:text-red-400 bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Searchable move dropdown
function MoveSlot({
  value,
  options,
  movesDataMap,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  options: string[];
  movesDataMap: Map<string, MoveData>;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const current = value ? movesDataMap.get(value.toLowerCase().replace(/\s/g, '')) : undefined;

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 80);
    return options.filter(m => m.toLowerCase().includes(query.toLowerCase())).slice(0, 80);
  }, [query, options]);

  if (disabled) {
    if (!current) return (
      <div className="flex-1 min-w-0 h-11 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center px-2">
        <span className="text-zinc-600 text-xs">{placeholder}</span>
      </div>
    );
    return (
      <div className="flex-1 min-w-0">
        <MoveCard move={current} onClear={() => {}} />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 relative">
      {current ? (
        <MoveCard move={current} onClear={() => onChange('')} />
      ) : (
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full h-[52px] flex items-center justify-between gap-1 px-3 bg-[#1a1a1f] hover:bg-zinc-800/50 border border-transparent rounded-lg text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span>{placeholder}</span>
          <ChevronDown className="w-4 h-4 shrink-0" />
        </button>
      )}

      {open && !current && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-1.5 border-b border-zinc-700">
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-zinc-800 text-xs text-zinc-200 px-2 py-1.5 rounded border border-zinc-600 focus:outline-none focus:border-[var(--gold)]"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map(m => {
              const md = movesDataMap.get(m.toLowerCase().replace(/\s/g, ''));
              const typeColor = md ? (typeColors[md.type] || '#777') : '#555';
              return (
                <button
                  key={m}
                  onClick={() => { onChange(m); setOpen(false); setQuery(''); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-700 text-left transition-colors"
                >
                  <span className="text-zinc-200 text-[13px] font-medium flex-1 truncate">{m}</span>
                  {md && (
                    <div className="flex items-center gap-2 shrink-0">
                      <span 
                        className="px-1.5 py-[1px] rounded-[3px] text-[8px] font-bold text-white uppercase tracking-wider border border-white/10"
                        style={{ backgroundColor: typeColor }}
                      >
                        {md.type}
                      </span>
                      {md.basePower > 0 && (
                        <span className="text-zinc-300 text-[11px] font-bold flex items-center gap-0.5 w-8" title="Base Power">
                          <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path><path d="M6.5 9.5L9.5 6.5"></path></svg>
                          {md.basePower}
                        </span>
                      )}
                      {md.accuracy !== undefined && (
                        <span className="text-zinc-400 text-[11px] font-medium flex items-center gap-0.5 w-8" title="Accuracy">
                          <svg className="w-2.5 h-2.5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>
                          {md.accuracy === true ? '-' : md.accuracy}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
  const [movesDataMap, setMovesDataMap] = useState<Map<string, MoveData>>(new Map());
  
  // Find the pokemon data
  const pkmnData = useMemo(() => {
    return Object.values(dbAccess).find(
      (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === member.pokemonName.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
  }, [member.pokemonName, dbAccess]);

  const data = pkmnData ? (pkmnData.augmented || pkmnData.vanilla) : null;
  const types: string[] = pkmnData?.types ?? [];
  const stats = data?.stats;
  const bst = stats ? stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe : 0;

  // Gather allowed abilities
  const allowedAbilities = useMemo(() => {
    if (!data?.abilities) return [];
    const abilities: string[] = [];
    Object.entries(data.abilities).forEach(([, ab]) => {
      if (typeof ab === 'string' && !abilities.includes(ab)) abilities.push(ab);
    });
    return abilities;
  }, [data]);

  // Gather allowed moves list (display names)
  const allowedMoves = useMemo(() => {
    if (!data) return [];
    const moveSet = new Set<string>();
    const movesSource = (data.moves && Object.keys(data.moves.levelUp || {}).length > 0) 
      ? data.moves : (pkmnData?.vanilla?.moves ?? {});

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    if (movesSource) {
      if (movesSource.levelUp) Object.values(movesSource.levelUp).forEach((arr: any) => arr.forEach((m: string) => moveSet.add(capitalize(m))));
      if (movesSource.tm_tr) movesSource.tm_tr.forEach((m: string) => moveSet.add(capitalize(m)));
      if (movesSource.egg) movesSource.egg.forEach((m: string) => moveSet.add(capitalize(m)));
      if (movesSource.tutor) movesSource.tutor.forEach((m: string) => moveSet.add(capitalize(m)));
    }
    return Array.from(moveSet).sort();
  }, [data, pkmnData]);

  // Fetch move data from Showdown
  useEffect(() => {
    if (allowedMoves.length === 0) return;
    fetch('https://play.pokemonshowdown.com/data/moves.json')
      .then(r => r.json())
      .then((all: Record<string, any>) => {
        const map = new Map<string, MoveData>();
        allowedMoves.forEach(moveName => {
          const key = moveName.toLowerCase().replace(/\s/g, '');
          const d = all[key];
          if (d) {
            map.set(key, {
              name: moveName,
              type: d.type ?? 'Normal',
              category: d.category ?? 'Status',
              basePower: d.basePower ?? 0,
              accuracy: d.accuracy ?? 100,
              pp: d.pp ?? 0,
            });
          }
        });
        setMovesDataMap(map);
      })
      .catch(() => {});
  }, [allowedMoves]);

  // Gather possible evolutions
  const possibleEvos = useMemo(() => {
    const evos: {name: string, method: string}[] = [];
    if (pkmnData?.vanilla?.evos?.length > 0) {
      pkmnData.vanilla.evos.forEach((evoKey: string) => {
        const evoData = Object.values(dbAccess).find(
          (p: any) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === evoKey.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (evoData) {
          const method = evoData.vanilla?.evoType || (evoData.vanilla?.evoLevel ? `Lv.${evoData.vanilla.evoLevel}` : '?');
          evos.push({ name: evoData.name, method });
        }
      });
    }
    return evos;
  }, [pkmnData, dbAccess]);

  const roles = ["Physical Sweeper", "Special Sweeper", "Mixed Sweeper", "Physical Wall", "Special Wall", "Mixed Wall", "Pivot", "Cleric", "Hazard Setter", "Hazard Remover", "Trapper", "Unassigned"];

  const smogonName = member.pokemonName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

  const StatBar = ({ label, value }: { label: string, value: number }) => {
    const widthPercentage = Math.min((value / 255) * 100, 100);
    return (
      <div className="flex items-center gap-2 my-0.5 text-xs">
        <span className="w-6 font-bold text-zinc-500 text-right">{label}</span>
        <span className="w-6 font-mono text-xs" style={{ color: getStatColor(value) }}>{value}</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full"
            style={{ width: `${widthPercentage}%`, backgroundColor: getStatColor(value) }}
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

  if (!pkmnData || !data) {
    return <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-white text-sm">Error loading {member.pokemonName}</div>;
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-visible shadow-xl border transition-all 
        ${isGraveyard ? 'border-zinc-700 bg-zinc-900 grayscale opacity-75' : 'border-zinc-700/80 bg-[#1a1a1f]'}`}
    >
      {/* Type Tags */}
      <div className="flex gap-1 px-3 pt-3">
        {types.map((t: string) => (
          <span 
            key={t}
            className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
            style={{ backgroundColor: typeColors[t] || '#777' }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* Header: Sprite + Name + BST */}
      <div className="flex items-center px-3 pt-1 pb-2 gap-3">
        <img 
          src={getAnimSpriteUrl(pkmnData.name)}
          onError={(e) => {
            const t = e.currentTarget as HTMLImageElement;
            t.src = getSpriteUrl(pkmnData.name);
          }}
          className="w-24 h-24 object-contain pixelated drop-shadow-lg shrink-0"
          alt={member.pokemonName}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <input
              type="text"
              value={member.nickname || member.pokemonName}
              onChange={(e) => updateMember(member.id, { nickname: e.target.value })}
              placeholder="Nickname"
              className="text-lg font-bold bg-transparent border-none text-white focus:ring-0 focus:outline-none placeholder-zinc-600 min-w-0 flex-1"
              disabled={isGraveyard}
            />
            <a
              href={`https://www.smogon.com/dex/ss/pokemon/${smogonName}/`}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Smogon"
              className="text-zinc-500 hover:text-blue-400 transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">BST {bst}</span>

          {/* Stats compact */}
          {stats && (
            <div className="mt-1.5">
              <StatBar label="HP" value={stats.hp} />
              <StatBar label="ATK" value={stats.atk} />
              <StatBar label="DEF" value={stats.def} />
              <StatBar label="SPA" value={stats.spa} />
              <StatBar label="SPD" value={stats.spd} />
              <StatBar label="SPE" value={stats.spe} />
            </div>
          )}
        </div>
      </div>

      {/* Role + Ability selectors */}
      <div className="px-3 pb-2 flex gap-2">
        <select
          value={member.role}
          onChange={(e) => updateMember(member.id, { role: e.target.value })}
          disabled={isGraveyard}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 focus:border-[var(--gold)] focus:ring-0"
        >
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={member.ability}
          onChange={(e) => updateMember(member.id, { ability: e.target.value })}
          disabled={isGraveyard}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-2 py-1.5 focus:border-[var(--gold)] focus:ring-0"
        >
          <option value="">Ability...</option>
          {allowedAbilities.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Item Selector */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700 rounded-lg px-2 py-1.5">
          {member.item && (
            <img
              src={`https://play.pokemonshowdown.com/sprites/itemicons/${member.item.toLowerCase().replace(/[^a-z0-9]+/g,'')}.png`}
              className="w-[24px] h-[24px] object-contain pixelated shrink-0"
              alt={member.item}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }}
              onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'visible'; }}
            />
          )}
          <select
            value={member.item || ''}
            onChange={(e) => updateMember(member.id, { item: e.target.value })}
            disabled={isGraveyard}
            className="flex-1 bg-transparent border-none text-zinc-200 text-sm font-medium focus:ring-0 focus:outline-none"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" className="bg-zinc-800 text-zinc-400 italic">No Item Held</option>
            {itemsList.map(i => (
              <option key={i} value={i} className="bg-zinc-800 text-zinc-200">{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Rich Move Slots */}
      <div className="px-3 pb-2 grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map(idx => (
          <MoveSlot
            key={idx}
            value={member.moves[idx]}
            options={allowedMoves}
            movesDataMap={movesDataMap}
            onChange={(v) => handleMoveChange(idx, v)}
            placeholder={`Move ${idx + 1}`}
            disabled={isGraveyard}
          />
        ))}
      </div>

      {/* Footer: Evolve + Actions */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1 border-t border-zinc-800 mt-1">
        <div className="flex gap-2">
          {!isGraveyard && possibleEvos.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) {
                  updateMember(member.id, { pokemonName: e.target.value, ability: '', moves: ['', '', '', ''] });
                  e.target.value = '';
                }
              }}
              value=""
              className="bg-zinc-900 hover:bg-zinc-700 text-green-400 border border-green-900/50 text-xs rounded-lg px-2 py-1 focus:outline-none max-w-[130px]"
            >
              <option value="">Evolve...</option>
              {possibleEvos.map(e => (
                <option key={e.name} value={e.name}>{e.name} ({e.method})</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex gap-1.5">
          {isGraveyard ? (
            <button
              onClick={() => reviveMember && reviveMember(member.id)}
              className="p-1.5 bg-zinc-800 hover:bg-green-900/50 text-zinc-400 hover:text-green-400 border border-zinc-700 hover:border-green-700 rounded-lg transition-colors"
              title="Revive"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => killMember && killMember(member.id)}
              className="p-1.5 bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-700 rounded-lg transition-colors"
              title="Mark as Dead"
            >
              <Skull className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => removeMember(member.id)}
            className="p-1.5 bg-zinc-800 hover:bg-red-900 text-zinc-400 hover:text-white border border-zinc-700 hover:border-red-600 rounded-lg transition-colors"
            title="Remove permanently"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
