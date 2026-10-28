import psycopg2

passwords = ["postgres", "admin", "root", "123456", "password", ""]
ports = [5432, 5433, 5434]

for port in ports:
    for pwd in passwords:
        try:
            conn = psycopg2.connect(
                dbname="postgres",
                user="postgres",
                password=pwd,
                host="localhost",
                port=port,
                connect_timeout=2
            )
            print(f"SUCCESS: port={port}, password='{pwd}'")
            conn.autocommit = True
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM pg_database WHERE datname='lab_elearning'")
            if not cur.fetchone():
                cur.execute("CREATE DATABASE lab_elearning")
                print("Database 'lab_elearning' created successfully!")
            else:
                print("Database 'lab_elearning' already exists.")
            cur.close()
            conn.close()
            exit(0)
        except Exception as e:
            pass

print("Could not auto-connect to postgres with default credentials.")
