import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()


def get_supabase_client():
    """Create and return a Supabase client."""
    try:
        from supabase import create_client
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        return create_client(url, key)
    except Exception as e:
        print(f"Warning: Could not initialize Supabase client: {e}")
        return None


class SupabaseDB:
    def __init__(self):
        self.client = get_supabase_client()

    def save_campaign(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a campaign to the campaigns table."""
        if not self.client:
            raise RuntimeError("Supabase client not initialized")
        result = self.client.table("campaigns").insert(data).execute()
        return result.data[0] if result.data else {}

    def get_campaigns(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch all campaigns ordered by newest first."""
        if not self.client:
            return []
        result = (
            self.client.table("campaigns")
            .select("*")
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []

    def get_campaign_by_id(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single campaign by its UUID."""
        if not self.client:
            return None
        result = (
            self.client.table("campaigns")
            .select("*")
            .eq("id", campaign_id)
            .execute()
        )
        return result.data[0] if result.data else None

    def delete_campaign(self, campaign_id: str) -> bool:
        """Delete a campaign by its UUID."""
        if not self.client:
            return False
        self.client.table("campaigns").delete().eq("id", campaign_id).execute()
        return True
