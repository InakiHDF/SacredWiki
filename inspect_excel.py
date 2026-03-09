import pandas as pd
import json

def main():
    file_path = r'e:\SacredWiki\Wild Encounters DS&BS.xlsx'
    df = pd.read_excel(file_path, header=None)
    data = df.head(100).where(pd.notnull(df), None).values.tolist()
    with open(r'e:\SacredWiki\excel_dump.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

if __name__ == '__main__':
    main()
