import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import locationsDataRaw from '../data/locations.json';
import { getSpriteUrl } from '../lib/utils';
import PokemonSprite from './PokemonSprite';

// Type definitions for the JSON structure
interface Encounter {
  pokemon: string;
  chance: number | string;
}

interface EncounterMethod {
  name: string;
  min_lvl: number;
  max_lvl: number;
  encounters: Encounter[];
}

interface WeatherNode {
  name: string;
  methods: EncounterMethod[];
}

interface LocationNode {
  name: string;
  weathers: WeatherNode[];
}

const locationsData = locationsDataRaw as LocationNode[];

interface LocationsViewProps {
  onSelectPokemon: (name: string) => void;
  searchTerm: string;
}

export default function LocationsView({ onSelectPokemon, searchTerm }: LocationsViewProps) {
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});

  const toggleLocation = (locName: string) => {
    setExpandedLocations(prev => ({ ...prev, [locName]: !prev[locName] }));
  };

  const filteredLocations = locationsData.filter(loc => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Check location name match
    if (loc.name.toLowerCase().includes(term)) return true;
    
    // Check if any pokemon inside matches
    for (const w of loc.weathers) {
      for (const m of w.methods) {
        if (m.encounters.some(e => e.pokemon.toLowerCase().includes(term))) {
          return true;
        }
      }
    }
    return false;
  });

  return (
    <div className="flex flex-col gap-4">
      {filteredLocations.map(loc => {
        const isExpanded = expandedLocations[loc.name] || (searchTerm && filteredLocations.length < locationsData.length);
        
        return (
          <div key={loc.name} className="bg-[var(--panel)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm transition-all">
            {/* Accordion Header */}
            <div 
              className="flex justify-between items-center p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
              onClick={() => toggleLocation(loc.name)}
            >
              <h2 className="text-lg font-bold text-zinc-100">{loc.name}</h2>
              {isExpanded ? <ChevronUp className="h-5 w-5 text-zinc-400" /> : <ChevronDown className="h-5 w-5 text-zinc-400" />}
            </div>

            {/* Accordion Body */}
            {isExpanded && (
              <div className="p-4 pt-0 border-t border-[var(--border-color)]">
                {loc.weathers.map(weather => (
                  <div key={weather.name} className="mt-4">
                    {/* Only show weather name if it's not the generic default or if there are multiple */}
                    {(loc.weathers.length > 1 || weather.name !== 'All Weathers') && (
                      <h3 className="text-md font-semibold text-[var(--gold)] mb-3">{weather.name}</h3>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {weather.methods.map((method, idx) => (
                        <div key={idx} className="bg-zinc-800/30 rounded-md border border-[var(--border-color)] p-3">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-zinc-200">{method.name}</h4>
                            <span className="text-xs text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                              Lvl {method.min_lvl} - {method.max_lvl}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {method.encounters.map((enc, eIdx) => (
                              <div 
                                key={eIdx} 
                                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-700/40 cursor-pointer transition-colors"
                                onClick={() => onSelectPokemon(enc.pokemon)}
                              >
                                <PokemonSprite 
                                  pokemonName={enc.pokemon} 
                                  className="w-8 h-8 object-contain pixelated"
                                  loading="lazy"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-zinc-200 truncate">{enc.pokemon}</p>
                                </div>
                                <div className="text-sm font-semibold text-[var(--gold)]">
                                  {typeof enc.chance === 'number' ? `${(enc.chance * 100).toFixed(0)}%` : enc.chance}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      
      {filteredLocations.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No locations found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
