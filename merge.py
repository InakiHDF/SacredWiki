import urllib.request
import json
import re
import os

def download_showdown_data():
    base_url = "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/"
    files = {
        "pokedex.json": "pokedex.json",
        "learnsets.json": "learnsets.json",
        "formats-data.json": "formats-data.json"
    }
    
    os.makedirs(r'e:\SacredWiki\base_data', exist_ok=True)
    
    for filename, save_name in files.items():
        save_path = os.path.join(r'e:\SacredWiki\base_data', save_name)
        if not os.path.exists(save_path):
            print(f"Downloading {filename}...")
            # We have to parse their pseudo-json (it's often exported as a TS/JS object)
            try:
                # Their data is TS files, wait they converted to JSON recently or still TS?
                # Actually, Showdown master/data is mostly TS now. Let's try downloading from play.pokemonshowdown.com/data/
                pass
            except Exception as e:
                print(e)
                
    # Better source for static JSON: https://play.pokemonshowdown.com/data/
    # They serve compiled JSON there.
    prod_url = "https://play.pokemonshowdown.com/data/"
    for filename in ["pokedex.json", "learnsets.json"]:
        save_path = os.path.join(r'e:\SacredWiki\base_data', filename)
        if not os.path.exists(save_path):
            print(f"Downloading {filename} from prod...")
            try:
                req = urllib.request.Request(prod_url + filename, headers={'User-Agent': 'Mozilla/5.0 Pokedex-Builder/1.0'})
                with urllib.request.urlopen(req) as response:
                    with open(save_path, 'wb') as f:
                        f.write(response.read())
            except Exception as e:
                print(f"Failed to download {filename}: {e}")

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        # Showdown JSON sometimes has a 'var exports = ' or something similar. 
        # play.pokemonshowdown.com JSONs are pure JSON or mostly pure.
        content = f.read()
        if content.startswith('exports.BattlePokedex = '):
            content = content.replace('exports.BattlePokedex = ', '')
        if content.startswith('exports.BattleLearnsets = '):
            content = content.replace('exports.BattleLearnsets = ', '')
        if content.endswith(';'):
            content = content[:-1]
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"Error decoding {filepath}: {e}")
            return {}

def merge_data():
    patch_path = r'e:\SacredWiki\divine_sword_patch.json'
    with open(patch_path, 'r', encoding='utf-8') as f:
        patch_data = json.load(f)
        
    pokedex = load_json(r'e:\SacredWiki\base_data\pokedex.json')
    learnsets = load_json(r'e:\SacredWiki\base_data\learnsets.json')
    
    merged_db = {}
    
    # Process Pokedex
    for key, base_info in pokedex.items():
        # Exclude Gen 9+ (num > 898)
        if base_info.get('num', 0) <= 0 or base_info.get('num', 0) > 898: continue
        
        name = base_info['name']
        if '-Mega' in name or '-Primal' in name or '-Starter' in name or '-Gmax' in name:
            continue
        
        norm_name = name.lower().replace('-', '').replace(' ', '').replace('.', '')
        
        # Determine if patched
        # In patch_data, keys are like "thievul", "zigzagoon (galarian)"
        # We need to map them carefully.
        patch_key = None
        
        # Check direct match
        for pk in patch_data.keys():
            # Basic normalization for patch key
            p_norm = pk.replace('-', '').replace(' ', '').replace('.', '')
            
            if p_norm == norm_name:
                patch_key = pk
                break
            
            # Special logic for regional forms
            if 'galarian' in pk and 'galar' in norm_name:
                base_pk = pk.replace('(galarian)', '').strip().replace(' ', '')
                if norm_name.startswith(base_pk):
                    patch_key = pk
                    break
            if 'alolan' in pk and 'alola' in norm_name:
                base_pk = pk.replace('alolan', '').strip().replace(' ', '')
                if norm_name.endswith(base_pk) or norm_name.startswith(base_pk):
                    patch_key = pk
                    break

        is_changed = patch_key is not None
        
        # Setup base structure
        entry = {
            "id": base_info['num'],
            "name": name,
            "types": base_info['types'],
            "isChanged": is_changed,
            "vanilla": {
                "stats": base_info['baseStats'],
                "abilities": base_info['abilities'],
                "moves": {"levelUp": {}, "tm_tr": [], "egg": [], "tutor": []},
                "prevo": base_info.get("prevo", None),
                "evos": base_info.get("evos", []),
                "evoType": base_info.get("evoType", None),
                "evoLevel": base_info.get("evoLevel", None)
            },
            "augmented": None
        }
        
        # Populate vanilla moves from learnsets
        ls = learnsets.get(key, {}).get('learnset', {})
        
        # Find the highest generation this Pokemon has Level Up moves (cap at 8)
        available_gens = set()
        for sources in ls.values():
            for src in sources:
                if len(src) >= 2 and src[1] == 'L' and src[0].isdigit():
                    available_gens.add(int(src[0]))
        
        target_gen = 8
        if available_gens:
            target_gen = max([g for g in available_gens if g <= 8], default=8)
            
        gen_prefix = str(target_gen)
        
        for move, sources in ls.items():
            for source in sources:
                if source.startswith(f'{gen_prefix}L'):
                    lvl = source[2:]
                    if lvl not in entry["vanilla"]["moves"]["levelUp"]:
                        entry["vanilla"]["moves"]["levelUp"][lvl] = []
                    entry["vanilla"]["moves"]["levelUp"][lvl].append(move)
                elif source.startswith(f'{gen_prefix}M') or source.startswith('8M'):
                    # Fallback TM to 8M if available, otherwise Gen Prefix M
                    if move not in entry["vanilla"]["moves"]["tm_tr"]:
                        entry["vanilla"]["moves"]["tm_tr"].append(move)
                elif source.startswith(f'{gen_prefix}E') or source.startswith('8E'):
                    if move not in entry["vanilla"]["moves"]["egg"]:
                        entry["vanilla"]["moves"]["egg"].append(move)
                elif source.startswith(f'{gen_prefix}T') or source.startswith('8T'):
                    if move not in entry["vanilla"]["moves"]["tutor"]:
                        entry["vanilla"]["moves"]["tutor"].append(move)
                    
        if is_changed:
            p_data = patch_data[patch_key]
            
            # Clone vanilla into augmented
            import copy
            aug = copy.deepcopy(entry["vanilla"])
            
            # Apply Stats
            if 'stats' in p_data:
                for stat, val in p_data['stats'].items():
                    if stat in aug['stats']:
                        aug['stats'][stat] = val
                    elif stat == 'bst':
                        pass # Calculate on frontend or store separately
                        
            # Apply Type
            if 'type' in p_data:
                entry['types'] = p_data['type'] # Override visual types for both? Or maybe just augmented. We'll put it on top level for now.
                
            # Apply Abilities
            if 'abilities' in p_data:
                for slot, ab in p_data['abilities'].items():
                    aug['abilities'][slot] = ab
                    
            # Apply Moves
            if 'moves' in p_data:
                if 'levelUp' in p_data['moves']:
                    for lvl, moves in p_data['moves']['levelUp'].items():
                        for m in moves:
                            move_name = m['move'].lower().replace(' ', '').replace('-', '') # Standardize internal name
                            # Resolve +, -, =
                            if m['type'] == '+':
                                if lvl not in aug['moves']['levelUp']: aug['moves']['levelUp'][lvl] = []
                                aug['moves']['levelUp'][lvl].append(m['move'])
                            elif m['type'] == '-':
                                # Try to remove if exists
                                for l in list(aug['moves']['levelUp'].keys()):
                                    aug['moves']['levelUp'][l] = [x for x in aug['moves']['levelUp'][l] if x.lower().replace(' ','').replace('-','') != move_name]
                            elif m['type'] == '=':
                                # Remove from old level, add to new
                                for l in list(aug['moves']['levelUp'].keys()):
                                    aug['moves']['levelUp'][l] = [x for x in aug['moves']['levelUp'][l] if x.lower().replace(' ','').replace('-','') != move_name]
                                if lvl not in aug['moves']['levelUp']: aug['moves']['levelUp'][lvl] = []
                                aug['moves']['levelUp'][lvl].append(m['move'])
                                
            # Parse TMs if any
            if 'tm_tr' in p_data:
                aug['moves']['tm_tr'].extend(p_data['tm_tr'])
                
            entry["augmented"] = aug
            
        merged_db[key] = entry
        
    out_path = r'e:\SacredWiki\pokedex-web\src\data\database.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(merged_db, f, indent=2)
        
    print(f"Successfully generated database.json with {len(merged_db)} pokemon.")

if __name__ == '__main__':
    download_showdown_data()
    merge_data()
