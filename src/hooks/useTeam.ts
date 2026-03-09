import { useState, useEffect } from 'react';

export interface TeamPokemon {
  id: string;
  pokemonName: string;
  nickname: string;
  role: string;
  item: string;
  ability: string;
  moves: [string, string, string, string];
  status: 'alive' | 'dead';
}

export function useTeam() {
  const [team, setTeam] = useState<TeamPokemon[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('sWiki_teamBuilder');
    if (saved) {
      try {
        setTeam(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse team data from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveTeam = (newTeam: TeamPokemon[]) => {
    setTeam(newTeam);
    localStorage.setItem('sWiki_teamBuilder', JSON.stringify(newTeam));
  };

  const addPokemon = (pokemonName: string) => {
    const newMember: TeamPokemon = {
      id: Math.random().toString(36).substring(2, 11),
      pokemonName,
      nickname: '',
      role: 'Unassigned',
      item: '',
      ability: '',
      moves: ['', '', '', ''],
      status: 'alive'
    };
    saveTeam([...team, newMember]);
  };

  const updatePokemon = (id: string, updates: Partial<TeamPokemon>) => {
    const newTeam = team.map(p => p.id === id ? { ...p, ...updates } : p);
    saveTeam(newTeam);
  };

  const removePokemon = (id: string) => {
    const newTeam = team.filter(p => p.id !== id);
    saveTeam(newTeam);
  };

  const killPokemon = (id: string) => {
    updatePokemon(id, { status: 'dead' });
  };
  
  const revivePokemon = (id: string) => {
    updatePokemon(id, { status: 'alive' });
  };

  const aliveTeam = team.filter(p => p.status === 'alive');
  const graveyard = team.filter(p => p.status === 'dead');

  return {
    team,
    aliveTeam,
    graveyard,
    isLoaded,
    addPokemon,
    updatePokemon,
    removePokemon,
    killPokemon,
    revivePokemon
  };
}
