"use client";

import { useState, useMemo } from "react";
import Navigation, { ViewMode } from "@/components/Navigation";
import PokemonTable from "@/components/PokemonTable";
import PokemonDetail from "@/components/PokemonDetail";
import LocationsView from "@/components/LocationsView";
import db from "@/data/database.json";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showChangedOnly, setShowChangedOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("augmented");
  const [activeTab, setActiveTab] = useState<'pokedex' | 'locations'>('pokedex');
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);

  const database = db as Record<string, any>;

  const filteredPokemon = useMemo(() => {
    return Object.values(database).filter((pokemon: any) => {
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
      
      return true;
    });
  }, [searchTerm, showChangedOnly]);

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
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-bold mb-6 text-zinc-100 flex items-center gap-3">
          <img src="https://play.pokemonshowdown.com/sprites/itemicons/master-ball.png" className="w-8 h-8 pixelated" alt="Master Ball"/>
          Pokémon Divine Sword & Blessed Shield
        </h1>
        
        <div className="mb-4">
          <p className="text-zinc-300">
            {activeTab === 'pokedex' ? (
              <>Showing <span className="text-[var(--gold)] font-bold">{filteredPokemon.length}</span> Pokémon. Select a row to view full details.</>
            ) : (
              <>Showing Wild Encounters. Expand a row to view locations.</>
            )}
          </p>
        </div>

        {activeTab === 'pokedex' ? (
          <PokemonTable 
            pokemonList={filteredPokemon} 
            viewMode={viewMode} 
            onSelectPokemon={setSelectedPokemon} 
          />
        ) : (
          <LocationsView 
            searchTerm={searchTerm}
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
