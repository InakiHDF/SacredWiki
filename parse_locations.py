import pandas as pd
import json
import re

def parse_excel_to_json(file_path):
    print("Loading Excel...")
    df = pd.read_excel(file_path, header=None)
    data = df.where(pd.notnull(df), None).values.tolist()

    locations = []
    
    current_location = None
    current_weather = None
    
    # Each location will have { "name": "Route 1", "weathers": [ { "name": "All Weathers", "methods": [...] } ] }
    # Each method: { "name": "Hidden", "min_lvl": 3, "max_lvl": 5, "encounters": [ { "pokemon": "Skwovet", "chance": 0.1 } ] }
    
    i = 0
    # Skip intro text
    while i < len(data):
        row = data[i]
        # Skip intro block (very long text in col 0)
        if row[0] and isinstance(row[0], str) and len(row[0]) > 50:
            i += 1
            continue
        break

    def extract_method_name_and_levels(text):
        if not text: return "Unknown", 1, 1
        # Example: "Hidden (Lvl 3-5)" or "Fishing (Lvl 37-40)"
        m = re.match(r'(.*?)\s*\(Lvl\s*(\d+)-(\d+)\)', text)
        if m:
            return m.group(1).strip(), int(m.group(2)), int(m.group(3))
        return text.strip(), 1, 1

    while i < len(data):
        row = data[i]
        
        # Check if empty row
        if not row[0] and not row[2]:
            i += 1
            continue
            
        # Is Location Header? (Col 0 has text, others are null)
        # Note: sometimes weather is Col0=Text, others=null right after Location Header.
        # We can distinguish: Location headers usually are distinct, followed immediately by Weather.
        # Let's peek row+1 to see if it's a Weather header or method header.
        
        if row[0] and row[1] is None and row[2] is None and row[3] is None:
            peek_row = data[i+1] if i+1 < len(data) else [None]*4
            # If peek_row is also a single col, or it's a method header (has 'Chance' in col 1)
            if peek_row[1] == 'Chance' or (peek_row[0] and peek_row[1] is None):
                # We reached a new Location or Weather block
                
                # Check if this row is Location or Weather
                # Usually: Location -> Weather -> Header. Or Location -> Header (if no weather).
                # To be safe, if we don't have a current location, it's a location.
                # If we have a location, but we hit another single column, it might be a new weather or sub-location.
                # Let's treat "Route X" or "... Area" as Location. 
                # Actually, in the dump, Location and SubLocation (Route 2 Secret Area) look like Locations.
                # Weather is usually "All Weathers", "Normal Weather", "Raining", etc.
                is_weather = "Weather" in row[0] or "Raining" in row[0] or "Snowing" in row[0] or "Sunny" in row[0] or "Overcast" in row[0] or "Thunderstorm" in row[0]
                
                if is_weather:
                    current_weather = {
                        "name": str(row[0]).strip(),
                        "methods": []
                    }
                    if current_location:
                        current_location["weathers"].append(current_weather)
                else:
                    current_location = {
                        "name": str(row[0]).strip(),
                        "weathers": []
                    }
                    current_weather = {
                        "name": "All Weathers", # default
                        "methods": []
                    }
                    locations.append(current_location)
            i += 1
            continue

        # Is Method Header?
        if row[1] == 'Chance':
            # This row defines column headers for left and/or right tables
            left_method, left_min, left_max = extract_method_name_and_levels(row[0])
            right_method, right_min, right_max = extract_method_name_and_levels(row[2])
            
            left_block = {"name": left_method, "min_lvl": left_min, "max_lvl": left_max, "encounters": []} if row[0] else None
            right_block = {"name": right_method, "min_lvl": right_min, "max_lvl": right_max, "encounters": []} if row[2] else None
            
            i += 1
            # Parse data rows until empty row or next header
            while i < len(data):
                d_row = data[i]
                if not d_row[0] and not d_row[2]: # Empty row terminates
                    break
                if d_row[1] == 'Chance': # Next header terminates
                    break
                    
                if left_block and d_row[0] and d_row[1] is not None:
                    left_block["encounters"].append({
                        "pokemon": str(d_row[0]).strip(),
                        "chance": float(d_row[1]) if isinstance(d_row[1], (int, float)) else d_row[1]
                    })
                    
                if right_block and d_row[2] and d_row[3] is not None:
                    right_block["encounters"].append({
                        "pokemon": str(d_row[2]).strip(),
                        "chance": float(d_row[3]) if isinstance(d_row[3], (int, float)) else d_row[3]
                    })
                i += 1
                
            if current_weather:
                if left_block and len(left_block["encounters"]) > 0:
                    current_weather["methods"].append(left_block)
                if right_block and len(right_block["encounters"]) > 0:
                    current_weather["methods"].append(right_block)
            continue
            
        # Unrecognized row falling through
        i += 1

    # Cleanup default weather if it wasn't used/populated uniquely
    for loc in locations:
        if len(loc["weathers"]) > 1 and loc["weathers"][0]["name"] == "All Weathers" and len(loc["weathers"][0]["methods"]) == 0:
            loc["weathers"] = loc["weathers"][1:]

    out_path = r'e:\SacredWiki\pokedex-web\src\data\locations.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(locations, f, indent=2)
    print(f"Exported {len(locations)} locations to {out_path}")

if __name__ == '__main__':
    parse_excel_to_json(r'e:\SacredWiki\Wild Encounters DS&BS.xlsx')
