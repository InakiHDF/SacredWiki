import React, { useEffect, useState } from "react";
import { X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { typeColors, getSpriteUrl, getStatColor, getBstColor } from "@/lib/utils";
import { ViewMode } from "@/components/Navigation";
import PokemonSprite from "./PokemonSprite";
import db from "@/data/database.json";

interface PokemonDetailProps {
  pokemon: any;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onClose: () => void;
  onNavigate: (pokemonName: string) => void;
  onAddBox?: () => void;
}

export default function PokemonDetail({ pokemon, viewMode, setViewMode, onClose, onNavigate, onAddBox }: PokemonDetailProps) {
  const [movesData, setMovesData] = useState<Record<string, any>>({});
  const [abilitiesData, setAbilitiesData] = useState<Record<string, any>>({});
  
  // Fetch move data precisely when needed from Showdown directly to save our db size
  useEffect(() => {
    fetch("https://play.pokemonshowdown.com/data/moves.json")
      .then(r => r.json())
      .then(data => setMovesData(data))
      .catch(e => console.error("Failed to load moves", e));

    fetch("https://play.pokemonshowdown.com/data/abilities.js")
      .then(r => r.text())
      .then(text => {
        try {
          const clean = text.replace('exports.BattleAbilities = ', 'return ');
          const parseFunc = new Function(clean);
          setAbilitiesData(parseFunc());
        } catch (err) {
          console.error("Parse error on abilities.js", err);
        }
      })
      .catch(e => console.error("Failed to load abilities", e));
  }, []);

  const data = viewMode === "augmented" && pokemon.augmented ? pokemon.augmented : pokemon.vanilla;
  const bst = data.stats.hp + data.stats.atk + data.stats.def + data.stats.spa + data.stats.spd + data.stats.spe;

  // If the Python parser emitted an empty moves structure for augmented, inherit strictly from vanilla
  const hasMoves = data.moves && Object.keys(data.moves.levelUp || {}).length > 0;
  const moves = hasMoves ? data.moves : pokemon.vanilla.moves;

  // Stat Bar Helper
  const StatBar = ({ label, value }: { label: string, value: number }) => {
    const widthPercentage = Math.min((value / 255) * 100, 100);
    return (
      <div className="flex items-center gap-3 my-1">
        <span className="w-8 text-xs font-bold text-zinc-400 uppercase">{label}</span>
        <span className="w-8 text-sm font-mono text-zinc-200 text-right">{value}</span>
        <div className="flex-1 h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${widthPercentage}%`,
              backgroundColor: getStatColor(value)
            }}
          />
        </div>
      </div>
    );
  };

  const dbAccess = db as Record<string, any>;
  
  // Evolution Tree Helper based on Showdown data structures
  const renderEvolutions = () => {
    const entry = pokemon.vanilla;
    if (!entry) return null;

    const findPkmn = (nameKey: string) => Object.values(dbAccess).find((p: any) => p.name.toLowerCase().replace(/[^a-z0-9]/g, '') === nameKey.toLowerCase().replace(/[^a-z0-9]/g, ''));

    const getRoot = (pkKey: string): any => {
      const pkData = findPkmn(pkKey);
      if (!pkData) return null;
      if (!pkData.vanilla.prevo) return pkData;
      return getRoot(pkData.vanilla.prevo);
    };

    const buildLine = (pkData: any, method: string | null = null): any[] => {
      let line = [{
        name: pkData.name,
        sprite: getSpriteUrl(pkData.name),
        isCurrent: pkData.name === pokemon.name,
        method: method
      }];
      
      if (pkData.vanilla.evos && pkData.vanilla.evos.length > 0) {
        // Just follow the first evolution path linearly for simple rendering. Space limits wide branch trees.
        pkData.vanilla.evos.forEach((evoKey: string) => {
          const evoData = findPkmn(evoKey);
          if (evoData) {
            const evoMethod = evoData.vanilla.evoType || (evoData.vanilla.evoLevel ? `Level ${evoData.vanilla.evoLevel}` : 'Unknown');
            line = line.concat(buildLine(evoData, evoMethod));
          }
        });
      }
      return line;
    };

    const root = getRoot(pokemon.name);
    if (!root) return null;
    
    // Deduplicate the line by name because branch parsing might append duplicates
    const rawLine = buildLine(root);
    const evos = rawLine.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);

    if (evos.length <= 1) return null;

    return (
      <div className="mt-8">
        <h3 className="text-lg font-bold text-zinc-100 mb-4 tracking-wide uppercase">Evolution Line</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 bg-[var(--panel)] p-4 sm:p-6 rounded-xl border border-[var(--border-color)]">
          {evos.map((evo, i) => (
            <React.Fragment key={evo.name}>
              {i > 0 && (
                <div className="flex flex-col items-center justify-center min-w-[60px]">
                  <ArrowRight className="text-zinc-500 mb-1 h-5 w-5" />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-center">{evo.method}</span>
                </div>
              )}
              <div 
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors cursor-pointer ${
                  evo.isCurrent 
                    ? 'bg-zinc-800 border-2 border-[var(--gold)] shadow-lg shadow-gold/10' 
                    : 'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-700 hover:border-zinc-500'
                }`}
                onClick={() => {
                  if (!evo.isCurrent) onNavigate(evo.name);
                }}
                title={evo.isCurrent ? "Currently viewing" : `View ${evo.name}`}
              >
                <img src={evo.sprite} alt={evo.name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain pixelated" />
                <span className={`text-xs sm:text-sm font-bold mt-2 ${evo.isCurrent ? 'text-[var(--gold)]' : 'text-zinc-300'}`}>
                  {evo.name}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Moveset Accordion
  const MoveAccordion = ({ title, moves }: { title: string, moves: any[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!moves || moves.length === 0) return null;

    return (
      <div className="border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--panel)]">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center p-4 bg-[#1f1f22] hover:bg-zinc-800 transition-colors"
        >
          <span className="font-semibold text-zinc-200">{title} ({moves.length})</span>
          {isOpen ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
        </button>
        
        {isOpen && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-color)] text-sm">
              <thead className="bg-[#18181b]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Level</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Move</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Cat</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-zinc-400">Pow</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-zinc-400">Acc</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {moves.map((m, idx) => {
                  const moveName = typeof m === 'string' ? m : m.move || m.name;
                  const lvl = typeof m === 'object' && m.level ? m.level : '-';
                  const moveKey = moveName.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const moveInfo = movesData[moveKey] || { type: 'Unknown', category: '-', basePower: '-', accuracy: '-', shortDesc: '-' };
                  
                  return (
                    <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-2 font-mono text-zinc-400">{lvl}</td>
                      <td className="px-4 py-2 font-medium text-zinc-200 capitalize">{moveName.replace(/([A-Z])/g, ' $1').trim()}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm uppercase tracking-wider" style={{ backgroundColor: typeColors[moveInfo.type] || '#777' }}>
                          {moveInfo.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-zinc-400">{moveInfo.category}</td>
                      <td className="px-4 py-2 text-center font-mono">{moveInfo.basePower || '-'}</td>
                      <td className="px-4 py-2 text-center font-mono">{moveInfo.accuracy === true ? '-' : moveInfo.accuracy}</td>
                      <td className="px-4 py-2 text-xs text-zinc-400 truncate max-w-xs" title={moveInfo.desc || moveInfo.shortDesc}>
                        {moveInfo.shortDesc}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Build the levelup move array properly sorted
  const levelUpMoves = Object.entries(moves?.levelUp || {}).flatMap(([lvl, mList]) => 
    (mList as string[]).map(move => ({ level: parseInt(lvl), move }))
  ).sort((a, b) => a.level - b.level);


  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pt-10 sm:pt-20 pb-10 px-4 pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
      
      <div className="relative bg-[#18181b] w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl border border-[var(--border-color)] flex flex-col pointer-events-auto overflow-hidden">
        
        {/* Header Ribbon */}
        <div className="h-12 border-b border-[var(--border-color)] bg-[#1f1f22] flex justify-between items-center px-6">
          <div className="flex items-center gap-4">
            <span className="font-mono text-zinc-500 font-bold hidden sm:inline-block">#{String(pokemon.id).padStart(3, '0')}</span>
            <h2 className="text-xl font-bold text-zinc-100">{pokemon.name}</h2>
            <div className="flex gap-2 ml-2">
              {pokemon.isChanged && (
                <button
                  onClick={() => setViewMode(viewMode === 'augmented' ? 'vanilla' : 'augmented')}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${
                    viewMode === 'augmented' 
                      ? 'bg-gold/20 text-[var(--gold)] border-[var(--gold)]' 
                      : 'bg-zinc-800 text-zinc-400 border-[var(--border-color)] hover:text-zinc-200'
                  }`}
                >
                  {viewMode === 'augmented' ? 'Augmented View' : 'Vanilla View'}
                </button>
              )}
              {onAddBox && (
                <button
                  onClick={onAddBox}
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-green-900/40 text-green-400 border border-green-700 hover:bg-green-800/60 rounded transition-colors"
                >
                  Add to Box
                </button>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-700 rounded-full transition-colors text-zinc-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[var(--border-color)]">
          
          {/* 2-Column Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            
            {/* Left Column: Sprite & Identity */}
            <div className="flex flex-col items-center justify-center p-6 bg-[var(--panel)] rounded-xl border border-[var(--border-color)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--gold)] opacity-[0.03] rounded-bl-full" />
              <PokemonSprite
                pokemonName={pokemon.name}
                className="pixelated h-32 md:h-40 object-contain drop-shadow-lg scale-100" 
              />
              
              <div className="mt-6 flex gap-2">
                {pokemon.types.map((t: string) => (
                  <span 
                    key={t} 
                    className="px-4 py-1 rounded-full text-sm font-bold text-white shadow-md uppercase tracking-wider"
                    style={{ backgroundColor: typeColors[t] || '#777' }}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 w-full">
                <h4 className="text-xs uppercase text-zinc-500 font-bold mb-2 text-center tracking-widest">Abilities</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(data.abilities).reduce((acc: any[], [slot, ab]: [string, any]) => {
                    // Deduplicate if we already have this ability strictly as a normal slot
                    const isDup = acc.some(a => a.ab === ab && slot === 'H');
                    if (!isDup) acc.push({ slot, ab });
                    return acc;
                  }, []).map(({slot, ab}) => {
                    const abKey = String(ab).toLowerCase().replace(/[^a-z0-9]/g, '');
                    const abDesc = abilitiesData[abKey]?.shortDesc || abilitiesData[abKey]?.desc || "No description available.";
                    return (
                      <span 
                        key={slot} 
                        title={abDesc}
                        className={`cursor-help px-3 py-1 text-sm rounded border ${slot === 'H' ? 'border-[var(--gold)] text-[var(--gold)] bg-[var(--gold)]/10' : 'border-zinc-700 text-zinc-300 bg-zinc-800'}`}
                      >
                        {ab as string} {slot === 'H' && <span className="text-[10px] font-bold ml-1">(H)</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Stats */}
            <div className="bg-[var(--panel)] rounded-xl border border-[var(--border-color)] p-6">
              <h3 className="text-lg font-bold text-zinc-100 mb-4 tracking-wide uppercase">Base Stats</h3>
              <div className="flex flex-col gap-1">
                <StatBar label="HP" value={data.stats.hp} />
                <StatBar label="Atk" value={data.stats.atk} />
                <StatBar label="Def" value={data.stats.def} />
                <StatBar label="SpA" value={data.stats.spa} />
                <StatBar label="SpD" value={data.stats.spd} />
                <StatBar label="Spe" value={data.stats.spe} />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-between items-center text-lg font-bold">
                <span className="text-zinc-400">Total</span>
                <span style={{ color: getBstColor(bst) }}>{bst}</span>
              </div>
            </div>

          </div>

          {/* Evolution Tree */}
          {renderEvolutions()}

          {/* Movesets */}
          <div className="mt-8 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-zinc-100 mb-2 border-b border-[var(--border-color)] pb-2 pt-4">Movesets</h3>
            <MoveAccordion title="Moves learnt via level-up" moves={levelUpMoves} />
            <MoveAccordion title="Moves learnt via Technical Machine" moves={moves?.tm_tr || []} />
            <MoveAccordion title="Moves learnt via Breeding" moves={moves?.egg || []} />
            <MoveAccordion title="Moves learnt via Tutor" moves={moves?.tutor || []} />
          </div>

        </div>
      </div>
    </div>
  );
}
