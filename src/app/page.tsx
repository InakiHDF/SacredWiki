"use client";

import { useState, useMemo } from "react";
import Navigation, { ViewMode } from "@/components/Navigation";
import PokemonTable from "@/components/PokemonTable";
import PokemonDetail from "@/components/PokemonDetail";
import LocationsView from "@/components/LocationsView";
import TeamBuilder from "@/components/TeamBuilder";
import TrainersView from "@/components/TrainersView";
import { useTeam } from "@/hooks/useTeam";
import db from "@/data/database.json";
import galarDexRaw from "@/data/galar_dex.json";

const galarDexSet = new Set<string>(galarDexRaw as string[]);

// Build a Galar order map from the raw array: pokemonName -> galar_dex_index
const galarOrderMap = new Map<string, number>();
(galarDexRaw as string[]).forEach((name, idx) => {
  galarOrderMap.set(name.toLowerCase().replace(/[^a-z0-9]/g, ''), idx);
});

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showChangedOnly, setShowChangedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("augmented");
  const [activeTab, setActiveTab] = useState<'pokedex' | 'locations' | 'teambuilder' | 'trainers'>('pokedex');
  const [dexMode, setDexMode] = useState<'national' | 'galar'>('national');
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  
  const teamHook = useTeam();

  const database = db as Record<string, any>;

  const filteredPokemon = useMemo(() => {
    let list = Object.values(database).filter((pokemon: any) => {
      // Filter by "Changed Only"
      if (showChangedOnly && !pokemon.isChanged) {
        return false;
      }
      
      // Filter by Name
      if (searchTerm) {
        if (!pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
      }

      // Filter by Galar Dex
      if (dexMode === 'galar') {
        const key = pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!galarDexSet.has(key)) return false;
      }
      
      return true;
    });

    // Sort: Galar dex order or National dex order (by id)
    if (dexMode === 'galar') {
      list = list.sort((a: any, b: any) => {
        const aKey = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const bKey = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const aIdx = galarOrderMap.get(aKey) ?? 9999;
        const bIdx = galarOrderMap.get(bKey) ?? 9999;
        return aIdx - bIdx;
      });
    }

    return list;
  }, [searchTerm, showChangedOnly, dexMode, database]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showChangedOnly={showChangedOnly}
        setShowChangedOnly={setShowChangedOnly}
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dexMode={dexMode}
        setDexMode={setDexMode}
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-bold mb-6 text-zinc-100 flex items-center gap-3">
          <img src="https://play.pokemonshowdown.com/sprites/itemicons/master-ball.png" className="w-8 h-8 pixelated" alt="Master Ball"/>
          Pokémon Divine Sword & Blessed Shield
        </h1>
        
        <div className="mb-4">
          <p className="text-zinc-300">
            {activeTab === 'pokedex' ? (
              <>
                {dexMode === 'galar' && <span className="text-blue-400 font-bold mr-2">[Dex de Galar]</span>}
                Showing <span className="text-[var(--gold)] font-bold">{filteredPokemon.length}</span> Pokémon. Select a row to view full details.
              </>
            ) : activeTab === 'locations' ? (
              <>Showing Wild Encounters. Expand a row to view locations.</>
            ) : activeTab === 'teambuilder' ? (
              <>Manage your Pokémon team and view your Box and Graveyard.</>
            ) : (
              <>Important Battles in order. <span className="text-yellow-400 font-bold">Level Caps</span> indicate the maximum level you should be for the fight.</>
            )}
          </p>
        </div>

        {activeTab === 'pokedex' ? (
          <PokemonTable 
            pokemonList={filteredPokemon} 
            viewMode={viewMode} 
            onSelectPokemon={setSelectedPokemon} 
          />
        ) : activeTab === 'locations' ? (
          <LocationsView 
            searchTerm={searchTerm}
            onSelectPokemon={(name) => {
              const found = Object.values(database).find((p: any) => p.name === name);
              if (found) setSelectedPokemon(found);
            }} 
          />
        ) : activeTab === 'teambuilder' ? (
          <TeamBuilder 
            teamHook={teamHook}
            onSelectPokemon={(name) => {
              const found = Object.values(database).find((p: any) => p.name === name);
              if (found) setSelectedPokemon(found);
            }} 
          />
        ) : (
          <TrainersView 
            database={database}
            onSelectPokemon={(name) => {
              const found = Object.values(database).find((p: any) => p.name === name);
              if (found) setSelectedPokemon(found);
            }}
          />
        )}
        
        {selectedPokemon && (
          <PokemonDetail 
            pokemon={selectedPokemon}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onClose={() => setSelectedPokemon(null)}
            onAddBox={() => {
              teamHook.addPokemon(selectedPokemon.name);
              alert(`${selectedPokemon.name} was added to your Box!`);
            }}
            onNavigate={(name) => {
              const found = Object.values(database).find((p: any) => p.name === name);
              if (found) setSelectedPokemon(found);
            }}
          />
        )}
      </main>
    </div>
  );
}
