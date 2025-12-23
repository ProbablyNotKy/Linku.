import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required.")

print(f"[Supabase] Connecting to Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print(f"[Supabase] Connected successfully!")
