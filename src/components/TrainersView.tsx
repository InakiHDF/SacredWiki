"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import trainersData from "@/data/trainers.json";
import PokemonSprite from "./PokemonSprite";
import { typeColors, getStatColor, getBstColor } from "@/lib/utils";
import { Swords, ShieldAlert, ChevronDown, ChevronUp, ClipboardCopy, Check } from "lucide-react";

interface TrainersViewProps {
  database: Record<string, any>;
  onSelectPokemon: (name: string) => void;
}

// ─── Tooltip component (portal + fixed pos — never clipped) ──────────────────
function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const updateCoords = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY - 8,   // 8px gap above element
      left: rect.left + rect.width / 2,
    });
  }, []);

  const show = useCallback(() => { updateCoords(); setVisible(true); }, [updateCoords]);
  const hide = useCallback(() => setVisible(false), []);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) hide();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [visible, hide]);

  const tooltipEl = visible && content && mounted ? createPortal(
    <div
      className="pointer-events-none"
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        transform: "translate(-50%, -100%)",
        zIndex: 9999,
      }}
    >
      <div className="w-60 bg-[#1a1a1e] border border-zinc-700 rounded-lg shadow-2xl p-3 text-xs text-zinc-300">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="inline-flex w-full"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => { e.stopPropagation(); visible ? hide() : show(); }}
    >
      {children}
      {tooltipEl}
    </div>
  );
}


// ─── Normalization utilities ────────────────────────────────────────────────
function getExportName(name: string) {
  let n = name.replace("Haxorous", "Haxorus")
              .replace("Wailren", "Walrein")
              .replace("Hippowdown", "Hippowdon")
              .replace("Zoroak", "Zoroark")
              .replace("Duraladon", "Duraludon")
              .replace("Garbador", "Garbodor");

  if (n === "Cherrim (Overcast)") return "Cherrim";
  if (n === "Lycanroc Day") return "Lycanroc";
  if (n === "G-Rapidash") return "Rapidash-Galar";
  if (n === "Galarian Weezing") return "Weezing-Galar";
  if (n === "Toxtricity-Lowkey") return "Toxtricity-Low-Key";
  if (n.startsWith("Zygarde 10%")) return "Zygarde-10%";
  if (n === "Sirfetch’d") return "Sirfetch'd";
  n = n.replace(/\s+1$/, ""); 
  
  return n;
}

function getDbName(name: string) {
  let n = getExportName(name);
  n = n.replace(/-?(Gmax|Dmax|Gmx|G)$/i, "");
  if (n === "Sirfetch'd") return "Sirfetch’d";
  return n;
}

function formatPokemonForSmogon(p: any): string {
  let exportText = `${getExportName(p.name)}`;
  if (p.item) exportText += ` @ ${p.item}`;
  
  if (p.ability) exportText += `\nAbility: ${p.ability}`;
  
  exportText += `\nLevel: ${p.level}`;
  
  if (p.evs) {
    const parts = p.evs.split("/").map((part: string) => part.trim());
    const normalizedParts = parts.map((part: string) => {
      const match = part.match(/^([A-Za-z]+)\s*(\d+)$/) || part.match(/^(\d+)\s*([A-Za-z]+)$/);
      if (match) {
        const isFirstNum = !isNaN(Number(match[1]));
        const num = isFirstNum ? match[1] : match[2];
        let stat = isFirstNum ? match[2] : match[1];
        if (stat === 'Spd') stat = 'Spe';
        return `${num} ${stat}`;
      }
      return part;
    });
    exportText += `\nEVs: ${normalizedParts.join(" / ")}`;
  }
  
  if (p.nature) exportText += `\n${p.nature} Nature`;
  
  if (p.moves && p.moves.length > 0) {
    p.moves.forEach((m: string) => {
      exportText += `\n- ${m}`;
    });
  }
  return exportText;
}

function ExportTeamButton({ trainer }: { trainer: any }) {
  const [copied, setCopied] = useState(false);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    const teamExport = trainer.pokemon.map((p: any) => formatPokemonForSmogon(p)).join("\n\n");
    navigator.clipboard.writeText(teamExport).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${copied ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50' : 'bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 border-zinc-700'}`}
      title="Export Team to Smogon format"
    >
      {copied ? <Check size={12} /> : <ClipboardCopy size={12} />}
      Export
    </button>
  );
}

// ─── Stat Bar (identical to PokemonDetail) ───────────────────────────────────
function StatBar({ label, value }: { label: string; value: number }) {
  const widthPercentage = Math.min((value / 255) * 100, 100);
  return (
    <div className="flex items-center gap-2 my-0.5">
      <span className="w-7 text-[10px] font-bold text-zinc-500 uppercase">{label}</span>
      <span className="w-7 text-xs font-mono text-zinc-200 text-right">{value}</span>
      <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${widthPercentage}%`, backgroundColor: getStatColor(value) }}
        />
      </div>
    </div>
  );
}

// ─── Move pill with tooltip ──────────────────────────────────────────────────
function MovePill({ moveName, movesData }: { moveName: string; movesData: Record<string, any> }) {
  const moveKey = moveName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const info = movesData[moveKey] || {};
  const type: string = info.type || "Normal";
  const power = info.basePower || null;
  const acc = info.accuracy === true ? "—" : info.accuracy || "—";
  const desc: string = info.shortDesc || info.desc || "";
  const secondary: string | null = info.secondary?.desc || info.secondary?.self?.desc || null;

  const tooltipContent = (
    <div className="space-y-1">
      <p className="font-bold text-zinc-100">{moveName}</p>
      {desc && <p className="text-zinc-400 leading-snug">{desc}</p>}
      {secondary && (
        <p className="text-amber-300 leading-snug border-t border-zinc-700 pt-1 mt-1">
          ⚡ {secondary}
        </p>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden cursor-help hover:border-zinc-500 transition-colors w-full">
        {/* Type accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: typeColors[type] || "#777" }} />
        <div className="px-2 py-1.5 flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-zinc-100 leading-none truncate">{moveName}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wide leading-none"
              style={{ backgroundColor: typeColors[type] || "#777" }}
            >
              {type}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">
              {power ? `⚔ ${power}` : "—"}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">
              {acc !== "—" ? `✓ ${acc}%` : "✓ —"}
            </span>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}

// ─── Ability pill with tooltip ───────────────────────────────────────────────
function AbilityPill({ abilityName, abilitiesData }: { abilityName: string; abilitiesData: Record<string, any> }) {
  const abKey = abilityName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const info = abilitiesData[abKey] || {};
  const desc: string = info.shortDesc || info.desc || "No description available.";

  const tooltipContent = (
    <div className="space-y-1">
      <p className="font-bold text-zinc-100">{abilityName}</p>
      <p className="text-zinc-400 leading-snug">{desc}</p>
    </div>
  );

  return (
    <Tooltip content={tooltipContent}>
      <span className="cursor-help px-2.5 py-1 text-xs rounded border border-zinc-700 text-zinc-300 bg-zinc-800 hover:border-zinc-500 transition-colors">
        {abilityName}
      </span>
    </Tooltip>
  );
}

// ─── Single Pokémon card ─────────────────────────────────────────────────────
function PokemonCard({
  p,
  pIdx,
  dbEntry,
  movesData,
  abilitiesData,
  onSelectPokemon,
}: {
  p: any;
  pIdx: number;
  dbEntry: any;
  movesData: Record<string, any>;
  abilitiesData: Record<string, any>;
  onSelectPokemon: (name: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const types: string[] = dbEntry ? dbEntry.types : [];
  const stats = dbEntry?.vanilla?.stats || dbEntry?.stats || null;
  const bst = stats ? stats.hp + stats.atk + stats.def + stats.spa + stats.spd + stats.spe : null;

  const handleExportToSmogon = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatPokemonForSmogon(p)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#121214] border border-[var(--border-color)] rounded-xl overflow-hidden flex flex-col relative group">
      {/* Export to Smogon button, visible on hover */}
      <button
        onClick={handleExportToSmogon}
        className="absolute top-2 right-2 p-1.5 z-10 bg-zinc-800/80 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all opacity-0 group-hover:opacity-100"
        title="Export to Smogon format"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <ClipboardCopy size={14} />}
      </button>

      {/* Pokémon header — clickable to open detail */}
      <div
        className="flex items-center gap-3 p-3 bg-zinc-900/60 cursor-pointer hover:bg-zinc-800/60 transition-colors border-b border-[var(--border-color)]"
        onClick={() => onSelectPokemon(dbEntry?.name || p.name)}
      >
        <div className="w-14 h-14 bg-zinc-800/60 rounded-lg flex items-center justify-center flex-shrink-0 border border-zinc-700/50">
          <PokemonSprite pokemonName={dbEntry?.name || p.name} className="w-12 h-12 object-contain pixelated" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-zinc-100 leading-none mb-1 truncate">{getExportName(p.name)}</h3>
          <div className="flex gap-1 flex-wrap mb-1">
            {types.length > 0
              ? types.map((t: string) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: typeColors[t] || "#777" }}
                  >
                    {t}
                  </span>
                ))
              : <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider bg-zinc-600">?</span>}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <span>Lv. <span className="font-black text-zinc-200">{p.level}</span></span>
            {p.nature && <span>• <span className="text-purple-300">{p.nature}</span></span>}
            {p.item && <span>• <span className="text-emerald-300">{p.item}</span></span>}
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 flex-1">
        {/* Ability */}
        {p.ability && (
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest mb-1">Ability</p>
            <AbilityPill abilityName={p.ability} abilitiesData={abilitiesData} />
          </div>
        )}

        {/* EVs */}
        {p.evs && (
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest mb-0.5">EVs/IVs</p>
            <p className="text-xs text-zinc-400 font-mono">{p.evs}</p>
          </div>
        )}

        {/* Stats */}
        {stats ? (
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest mb-1">Base Stats</p>
            <div className="space-y-0">
              <StatBar label="HP" value={stats.hp} />
              <StatBar label="Atk" value={stats.atk} />
              <StatBar label="Def" value={stats.def} />
              <StatBar label="SpA" value={stats.spa} />
              <StatBar label="SpD" value={stats.spd} />
              <StatBar label="Spe" value={stats.spe} />
            </div>
            {bst !== null && (
              <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-zinc-800 text-xs font-bold">
                <span className="text-zinc-500">BST</span>
                <span style={{ color: getBstColor(bst) }}>{bst}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Moves */}
        {p.moves && p.moves.length > 0 && (
          <div>
            <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest mb-1.5">Moves</p>
            <div className="grid grid-cols-2 gap-1.5">
              {p.moves.map((m: string, mIdx: number) => (
                <MovePill key={mIdx} moveName={m} movesData={movesData} />
              ))}
              {Array.from({ length: Math.max(0, 4 - p.moves.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="bg-zinc-800/30 border border-zinc-800 border-dashed rounded-lg px-2 py-3 text-center text-zinc-700 text-xs"
                >
                  —
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function TrainersView({ database, onSelectPokemon }: TrainersViewProps) {
  const [movesData, setMovesData] = useState<Record<string, any>>({});
  const [abilitiesData, setAbilitiesData] = useState<Record<string, any>>({});
  const [openTrainers, setOpenTrainers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("https://play.pokemonshowdown.com/data/moves.json")
      .then((r) => r.json())
      .then((data) => setMovesData(data))
      .catch((e) => console.error("Failed to load moves", e));

    fetch("https://play.pokemonshowdown.com/data/abilities.js")
      .then((r) => r.text())
      .then((text) => {
        try {
          const clean = text.replace("exports.BattleAbilities = ", "return ");
          const parseFunc = new Function(clean);
          setAbilitiesData(parseFunc());
        } catch (err) {
          console.error("Parse error on abilities.js", err);
        }
      })
      .catch((e) => console.error("Failed to load abilities", e));
  }, []);

  const toggleTrainer = (index: number) => {
    setOpenTrainers((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  // Group trainers by sheet (battle category)
  const sheetOrder: string[] = [];
  (trainersData as any[]).forEach((t: any) => {
    if (!sheetOrder.includes(t.sheet)) sheetOrder.push(t.sheet);
  });

  const sheetColors: Record<string, string> = {
    "Gym Leaders": "#b45309",        // amber
    "Rival Battles": "#1d4ed8",      // blue
    "Elite Four": "#7c3aed",         // purple
    "Champion": "#047857",           // green
    "Post Game": "#be185d",          // pink
  };

  return (
    <div className="flex flex-col gap-10">
      {sheetOrder.map((sheet) => {
        const trainers = (trainersData as any[]).filter((t) => t.sheet === sheet);
        const accentColor = sheetColors[sheet] || "#555";

        return (
          <section key={sheet}>
            {/* Sheet header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-[var(--border-color)]" />
              <span
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: accentColor }}
              >
                {sheet}
              </span>
              <div className="h-px flex-1 bg-[var(--border-color)]" />
            </div>

            <div className="flex flex-col gap-3">
              {trainers.map((trainer: any, rawIdx: number) => {
                // Use global index for collapse state key
                const globalIdx = (trainersData as any[]).indexOf(trainer);
                const isOpen = openTrainers[globalIdx] ?? false;

                return (
                  <div
                    key={`${trainer.name}-${globalIdx}`}
                    className="bg-[var(--panel)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-md"
                  >
                    {/* Trainer Header — collapse toggle */}
                    <div
                      className="w-full flex items-center justify-between p-4 bg-[#1f1f22] hover:bg-zinc-800/70 transition-colors text-left cursor-pointer"
                      onClick={() => toggleTrainer(globalIdx)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-full border"
                          style={{ backgroundColor: `${accentColor}30`, borderColor: `${accentColor}60` }}
                        >
                          <Swords className="w-5 h-5" style={{ color: accentColor }} />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-zinc-100">{trainer.name}</h2>
                          <p className="text-xs text-zinc-500">
                            {trainer.pokemon.length} Pokémon &nbsp;•&nbsp; Ace Lv. {trainer.ace_level}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <ExportTeamButton trainer={trainer} />
                        <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/50 px-3 py-1.5 rounded-lg">
                          <ShieldAlert className="w-4 h-4 text-red-400" />
                          <div className="text-right">
                            <p className="text-[9px] text-red-300/70 font-bold uppercase tracking-wider leading-none">Level Cap</p>
                            <p className="text-base font-black text-red-200 leading-none">{trainer.ace_level}</p>
                          </div>
                        </div>
                        <div className="text-zinc-500">
                          {isOpen
                            ? <ChevronUp className="w-5 h-5" />
                            : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Pokémon Grid — shown only when expanded */}
                    {isOpen && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {trainer.pokemon.map((p: any, pIdx: number) => {
                          const lookupName = getDbName(p.name);
                          const dbEntry = Object.values(database).find(
                            (entry: any) => entry.name === lookupName
                          );
                          return (
                            <PokemonCard
                              key={pIdx}
                              p={p}
                              pIdx={pIdx}
                              dbEntry={dbEntry}
                              movesData={movesData}
                              abilitiesData={abilitiesData}
                              onSelectPokemon={onSelectPokemon}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
