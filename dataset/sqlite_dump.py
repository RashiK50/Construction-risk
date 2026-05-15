import sqlite3
import json

def migrate_to_sqlite(json_source='cleaned_risk_register.json', db_name='risk_data.db'):
    # Connect and create table with BIN as the primary key for fast indexing
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS violations (
            bin TEXT PRIMARY KEY,
            risk_data_json TEXT
        )
    ''')

    # Load the JSON you just created
    with open(json_source, 'r') as f:
        risk_data = json.load(f)

    # Batch insert for efficiency
    insert_payload = [(str(bin_id), json.dumps(issues)) for bin_id, issues in risk_data.items()]
    
    cursor.executemany('INSERT OR REPLACE INTO violations VALUES (?, ?)', insert_payload)
    
    conn.commit()
    conn.close()
    print(f"Migration Complete: {len(insert_payload)} building records stored in {db_name}.")

if __name__ == "__main__":
    migrate_to_sqlite()