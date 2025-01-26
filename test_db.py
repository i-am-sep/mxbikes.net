import os
import sqlite3

def test_sqlite():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    instance_path = os.path.join(base_dir, 'instance')
    db_file = os.path.join(instance_path, 'test.db')
    
    print(f"Testing SQLite connection")
    print(f"Database file: {db_file}")
    
    # Ensure instance directory exists
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        print(f"Created instance directory")
    
    try:
        # Try to connect to SQLite and create a simple table
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Create a test table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS test (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL
            )
        ''')
        
        # Insert a test row
        cursor.execute('INSERT INTO test (name) VALUES (?)', ('test',))
        
        # Commit the changes
        conn.commit()
        
        print("Successfully created and wrote to database!")
        
        # Verify the data
        cursor.execute('SELECT * FROM test')
        rows = cursor.fetchall()
        print("\nDatabase contents:")
        for row in rows:
            print(row)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    test_sqlite()
