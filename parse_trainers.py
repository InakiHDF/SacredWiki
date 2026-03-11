import pandas as pd
import json
import math
import re

def main():
    file_path = r'e:\SacredWiki\Important Trainers.xlsx'
    xls = pd.ExcelFile(file_path)
    
    all_battles = []
    
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name, header=None)
        data = df.where(pd.notnull(df), None).values.tolist()
        
        for r in range(len(data)):
            row = data[r]
            for c in range(len(row)):
                cell = row[c]
                if isinstance(cell, str):
                    # Check if this cell is likely a battle header
                    # It must be a string, the row below must be None, and two rows below must be a string (Pokemon name)
                    if r + 2 < len(data) and isinstance(data[r+2][c], str) and data[r+1][c] is None:
                        if 'Template' in cell or 'Full credit' in cell or 'https://' in cell:
                            continue
                        
                        if '(If you chose Scorbunny)' in cell or '(If you chose Sobble)' in cell:
                            continue
                            
                        # Ensure r+3 has a numeric level to be absolutely certain it's a battle block
                        level_val = data[r+3][c] if r+3 < len(data) else None
                        is_valid_level = False
                        if isinstance(level_val, (int, float)) and not math.isnan(level_val):
                            is_valid_level = True
                        elif isinstance(level_val, str) and re.search(r'\d+', level_val):
                            is_valid_level = True
                            
                        if not is_valid_level:
                            continue
                            
                        battle_name = cell.replace('(If you chose Grookey)', '').replace('- (If you chose Grookey)', '').strip()
                        if battle_name.endswith('-'):
                             battle_name = battle_name[:-1].strip()
                        
                        pokemon_list = []
                        col = c
                        while col < len(row) and r+2 < len(data) and isinstance(data[r+2][col], str):
                            p_name = data[r+2][col]
                            level = data[r+3][col] if r+3 < len(data) else None
                            item = data[r+4][col] if r+4 < len(data) else None
                            ability = data[r+5][col] if r+5 < len(data) else None
                            nature = data[r+6][col] if r+6 < len(data) else None
                            evs = data[r+7][col] if r+7 < len(data) else None
                            
                            moves = []
                            for m_offset in range(8, 12):
                                if r + m_offset < len(data):
                                    move = data[r+m_offset][col]
                                    if isinstance(move, str) and move.strip() and move.strip() != "-":
                                        moves.append(move.strip())
                                        
                            # Parse level safely
                            parsed_level = level
                            if isinstance(level, (int, float)) and not math.isnan(level):
                                parsed_level = int(level)
                            elif isinstance(level, str):
                                match = re.search(r'\d+', level)
                                if match:
                                    parsed_level = int(match.group())
                            
                            pokemon_list.append({
                                'name': str(p_name).strip(),
                                'level': parsed_level,
                                'item': str(item).strip() if isinstance(item, str) and str(item).strip() and str(item).strip() != "-" else None,
                                'ability': str(ability).strip() if isinstance(ability, str) and str(ability).strip() and str(ability).strip() != "-" else None,
                                'nature': str(nature).strip() if isinstance(nature, str) and str(nature).strip() and str(nature).strip() != "-" else None,
                                'evs': str(evs).strip() if isinstance(evs, str) and str(evs).strip() and str(evs).strip() != "-" else None,
                                'moves': moves
                            })
                            col += 1
                            
                        if len(pokemon_list) > 0:
                            max_lvl = 0
                            for p in pokemon_list:
                                if isinstance(p['level'], int) and p['level'] > max_lvl:
                                    max_lvl = p['level']
                                    
                            if not any(b['name'] == battle_name and b['sheet'] == sheet_name for b in all_battles):
                                all_battles.append({
                                    'name': battle_name,
                                    'sheet': sheet_name,
                                    'pokemon': pokemon_list,
                                    'ace_level': max_lvl
                                })

    # Sort battles chronologically by ace_level
    all_battles.sort(key=lambda x: x['ace_level'])

    with open(r'e:\SacredWiki\src\data\trainers.json', 'w', encoding='utf-8') as f:
        json.dump(all_battles, f, indent=2)
        
if __name__ == '__main__':
    main()
