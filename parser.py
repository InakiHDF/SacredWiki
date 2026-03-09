import re
import json
import os

def parse_pokemon_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    data = {}
    current_pokemon = []

    # Regex patterns
    # Matches ### **Name** or **Name** or **Name & Name** etc
    pokemon_name_pattern = re.compile(r'^\s*(?:###)?\s*\*{2}([^*]+)\*{2}\s*$')
    
    stat_change_pattern = re.compile(r'^([A-Za-z ]+):\s*\d+\s*(?:\\?-\\?>|->|\\->)\s*(\d+)', re.IGNORECASE)
    
    # Abilities
    ability_pattern = re.compile(r'^(Ability One|Ability Two|Ability Three|Hidden Ability)(?:\s*\(([^)]+)\))?\s*:\s*(.+)', re.IGNORECASE)
    # Combined abilities e.g. Ability One/Two: Shed Skin
    ability_combined_pattern = re.compile(r'^Ability One/Two\s*:\s*(.+)', re.IGNORECASE)

    # Type
    type_pattern = re.compile(r'^Type:\s*(.+)', re.IGNORECASE)
    
    # Moves
    # Matches + Level 10 - Fake Out or \+ Level 1 \- Growth or = Evolve - Extrasensory
    move_pattern = re.compile(r'^\\?([+\-=])\s*(.+?)\s*(?:\\-|-)\s*(.+)', re.IGNORECASE)

    # Specific stats override format: Lopunny Stats:
    specific_stats_pattern = re.compile(r'^([A-Za-z ]+) Stats:', re.IGNORECASE)

    # TM/TR
    tm_pattern = re.compile(r'^TM/TRs?(?:\s*:\s*Can now learn\s*|\s*(?:\\-|-)\s*|\s*:\s*)(.+)', re.IGNORECASE)
    
    # TBD: 50% Chance of Holding Power Herb
    misc_pattern = re.compile(r'^(\d+% Chance of .+)', re.IGNORECASE)

    current_specific_stat_target = None

    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for new Pokemon
        name_match = pokemon_name_pattern.match(line)
        if name_match:
            raw_target = name_match.group(1).strip()
            # It could be "Sobble/Drizzile/Inteleon" -> split by /
            targets = [t.strip() for t in re.split(r'/|&| and ', raw_target)]
            current_pokemon = targets
            current_specific_stat_target = None
            
            for t in current_pokemon:
                if t not in data:
                    data[t] = {
                        'stats': {},
                        'abilities': {},
                        'moves': {'levelUp': {}, 'evolve': [], 'misc': []},
                        'type': None,
                        'tm_tr': [],
                        'misc': []
                    }
            continue

        if not current_pokemon:
            continue
            
        # Specific stats header
        specific_stats_match = specific_stats_pattern.match(line)
        if specific_stats_match:
            current_specific_stat_target = specific_stats_match.group(1).strip()
            continue
            
        # Stat changes
        stat_match = stat_change_pattern.match(line)
        if stat_match:
            stat_name = stat_match.group(1).strip().lower()
            stat_val = int(stat_match.group(2).strip())
            
            targets = [current_specific_stat_target] if current_specific_stat_target else current_pokemon
            for t in targets:
                if t in data:
                    # Map standard names
                    key = stat_name
                    if key == 'hp': key = 'hp'
                    elif key == 'attack': key = 'atk'
                    elif key == 'defense': key = 'def'
                    elif key == 'special attack': key = 'spa'
                    elif key == 'special defense': key = 'spd'
                    elif key == 'speed': key = 'spe'
                    elif key == 'bst' or key == 'total': key = 'bst'
                    
                    data[t]['stats'][key] = stat_val
            continue

        # Type changes
        type_match = type_pattern.match(line)
        if type_match:
            new_type = [x.strip() for x in type_match.group(1).split('/')]
            for t in current_pokemon:
                if t in data:
                    data[t]['type'] = new_type
            continue

        # Abilities
        ability_match = ability_pattern.match(line)
        if ability_match:
            slot = ability_match.group(1).strip().lower()
            specific = ability_match.group(2)
            ability = ability_match.group(3).strip()
            
            targets = [specific.strip()] if specific else current_pokemon
            for t in targets:
                if t in data:
                    slot_key = '0' if 'one' in slot else '1' if 'two' in slot else '2' if 'three' in slot else 'H'
                    data[t]['abilities'][slot_key] = ability
            continue

        combined_ab_match = ability_combined_pattern.match(line)
        if combined_ab_match:
            ability = combined_ab_match.group(1).strip()
            for t in current_pokemon:
                if t in data:
                    data[t]['abilities']['0'] = ability
                    data[t]['abilities']['1'] = ability
            continue

        # Moves
        move_match = move_pattern.match(line)
        if move_match:
            prefix = move_match.group(1).strip() # +, -, =
            level_info = move_match.group(2).strip().lower() # Level 10, Evolve, Evolution, Level 1/Evolve
            move_name_raw = move_match.group(3).strip()
            
            # Check for specific target (Inteleon Only)
            specific_target = None
            if '(' in move_name_raw and 'Only)' in move_name_raw:
                move_name_parts = move_name_raw.split('(')
                move_name = move_name_parts[0].strip()
                specific_target = move_name_parts[1].replace('Only)', '').strip()
            else:
                move_name = move_name_raw
                
            targets = [specific_target] if specific_target else current_pokemon
            
            for t in targets:
                if t not in data: continue
                entry = {"move": move_name, "type": prefix}
                
                if 'evolve' in level_info or 'evolution' in level_info:
                    data[t]['moves']['evolve'].append(entry)
                    if 'level' in level_info: # e.g. Level 1/Evolve
                        lvl_match = re.search(r'level\s*(\d+)', level_info)
                        if lvl_match:
                            lvl = lvl_match.group(1)
                            if lvl not in data[t]['moves']['levelUp']:
                                data[t]['moves']['levelUp'][lvl] = []
                            data[t]['moves']['levelUp'][lvl].append(entry)
                elif 'level' in level_info:
                    lvl_match = re.search(r'level\s*(\d+)', level_info)
                    if lvl_match:
                        lvl = lvl_match.group(1)
                        if lvl not in data[t]['moves']['levelUp']:
                            data[t]['moves']['levelUp'][lvl] = []
                        data[t]['moves']['levelUp'][lvl].append(entry)
                else:
                    data[t]['moves']['misc'].append({"move": move_name, "type": prefix, "info": level_info})
            continue

        # TMs
        tm_match = tm_pattern.match(line)
        if tm_match:
            tms = [m.strip() for m in re.split(r',| and ', tm_match.group(1))]
            # e.g. Ice, Fire, and Thunder Fang -> Ice Fang, Fire Fang, Thunder Fang? Handling this perfectly is hard, let's just store as strings
            for t in current_pokemon:
                if t in data:
                    data[t]['tm_tr'].extend(tms)
            continue
            
        # Other loose info (50% chance holding herb)
        if "chance" in line.lower() and "holding" in line.lower():
            for t in current_pokemon:
                if t in data:
                    data[t]['misc'].append(line)
            continue

    # Cleanup empty dicts/lists to keep JSON small
    final_data = {}
    for k, v in data.items():
        # Remove empty stats/abilities/moves
        cleaned = {}
        if v['stats']: cleaned['stats'] = v['stats']
        if v['abilities']: cleaned['abilities'] = v['abilities']
        if v['type']: cleaned['type'] = v['type']
        if v['tm_tr']: cleaned['tm_tr'] = v['tm_tr']
        if v['misc']: cleaned['misc'] = v['misc']
        
        has_moves = False
        moves = {}
        if v['moves']['levelUp']: 
            moves['levelUp'] = v['moves']['levelUp']
            has_moves = True
        if v['moves']['evolve']: 
            moves['evolve'] = v['moves']['evolve']
            has_moves = True
        if v['moves']['misc']: 
            moves['misc'] = v['moves']['misc']
            has_moves = True
            
        if has_moves:
            cleaned['moves'] = moves
            
        if cleaned: # only keep if there are changes
            # Normalize name key (e.g. Caterpie #013 -> Caterpie)
            norm_name = re.sub(r'#\d+', '', k).strip().lower()
            final_data[norm_name] = cleaned

    return final_data

if __name__ == '__main__':
    filepath = r'e:\SacredWiki\New Changes List - Pokemon.md'
    outpath = r'e:\SacredWiki\divine_sword_patch.json'
    res = parse_pokemon_markdown(filepath)
    with open(outpath, 'w', encoding='utf-8') as f:
        json.dump(res, f, indent=2)
    print(f"Parsed {len(res)} pokemon with changes and saved to {outpath}")
