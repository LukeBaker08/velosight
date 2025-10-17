import os, psycopg2, psycopg2.extras

def get_pg_conn():
    return psycopg2.connect(
        host=os.getenv("PGHOST"),
        port=os.getenv("PGPORT", "5432"),
        user=os.getenv("PGUSER"),
        password=os.getenv("PGPASSWORD"),
        dbname=os.getenv("PGDATABASE", "postgres"),
    )

DictCursor = psycopg2.extras.RealDictCursor