"use client";

import React from "react";
import { Search } from "lucide-react";

export type ViewMode = "vanilla" | "augmented";

interface NavigationProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showChangedOnly: boolean;
  setShowChangedOnly: (show: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeTab: 'pokedex' | 'locations' | 'teambuilder' | 'trainers';
  setActiveTab: (tab: 'pokedex' | 'locations' | 'teambuilder' | 'trainers') => void;
  dexMode: 'national' | 'galar';
  setDexMode: (mode: 'national' | 'galar') => void;
}

export default function Navigation({
  searchTerm,
  setSearchTerm,
  showChangedOnly,
  setShowChangedOnly,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  dexMode,
  setDexMode
}: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border-color)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4">
          
          {/* Top Row: Tabs */}
          <div className="flex justify-center sm:justify-start w-full">
            <div className="flex bg-zinc-800/50 p-1 rounded-lg border border-[var(--border-color)]">
              <button
                onClick={() => setActiveTab('pokedex')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'pokedex' 
                  ? 'bg-[var(--gold)] text-black shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                }`}
              >
                Pokédex
              </button>
              <button
                onClick={() => setActiveTab('locations')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'locations' 
                  ? 'bg-[var(--gold)] text-black shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                }`}
              >
                Locations
              </button>
              <button
                onClick={() => setActiveTab('teambuilder')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'teambuilder' 
                  ? 'bg-[var(--gold)] text-black shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                }`}
              >
                Team Builder
              </button>
              <button
                onClick={() => setActiveTab('trainers')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'trainers' 
                  ? 'bg-[var(--gold)] text-black shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                }`}
              >
                Trainers
              </button>
            </div>
          </div>

          {/* Search Row */}
          <div className="relative w-full text-zinc-400 focus-within:text-zinc-100">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search by Pokémon name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[var(--border-color)] rounded-md leading-5 bg-[var(--panel)] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[var(--gold)] focus:border-[var(--gold)] sm:text-sm"
            />
          </div>

          {/* Bottom Row: Toggles */}
          <div className="flex justify-end items-center gap-4">
            
            {/* Toggles */}
            <div className="flex gap-2 w-full sm:w-auto justify-end flex-wrap">

              {/* Dex Mode Toggle - only shown on Pokédex tab */}
              {activeTab === 'pokedex' && (
                <div className="flex items-center bg-zinc-800/70 border border-[var(--border-color)] rounded-md p-0.5">
                  <button
                    onClick={() => setDexMode('national')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                      dexMode === 'national'
                        ? 'bg-red-800/70 text-red-200 border border-red-600'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Nacional
                  </button>
                  <button
                    onClick={() => setDexMode('galar')}
                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                      dexMode === 'galar'
                        ? 'bg-blue-800/70 text-blue-200 border border-blue-600'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Galar
                  </button>
                </div>
              )}

              <button
                onClick={() => setViewMode(viewMode === 'augmented' ? 'vanilla' : 'augmented')}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium border transition-colors ${
                  viewMode === 'augmented' 
                    ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700' 
                    : 'bg-[var(--panel)] text-zinc-400 border-[var(--border-color)] hover:text-zinc-200'
                }`}
              >
                {viewMode === 'augmented' ? 'Changelog View' : 'Vanilla View'}
              </button>
              
              <button
                onClick={() => setShowChangedOnly(!showChangedOnly)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md font-medium border transition-colors ${
                  showChangedOnly 
                    ? 'bg-green-900/40 text-green-300 border-green-700' 
                    : 'bg-[var(--panel)] text-zinc-400 border-[var(--border-color)] hover:text-zinc-200'
                }`}
              >
                Changed Only
              </button>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
