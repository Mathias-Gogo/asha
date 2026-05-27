import re
from app.utils.logger import logger


class SocialService:
    """
    Normalises social handles/URLs.
    Scraping (BeautifulSoup / Playwright) will be wired in here later.
    """

    def parse_handle(self, raw: str | None, platform: str) -> str | None:
        if not raw:
            return None
        handle = raw.strip().lstrip("@").split("/")[-1].split("?")[0]
        logger.info(f"Parsed {platform} handle: {handle}")
        return handle

    def build_profile_url(self, handle: str, platform: str) -> str:
        urls = {
            "instagram": f"https://www.instagram.com/{handle}/",
            "twitter":   f"https://twitter.com/{handle}",
            "tiktok":    f"https://www.tiktok.com/@{handle}",
        }
        return urls.get(platform.lower(), "")

    def extract_social_context(self, business_data: dict) -> dict:
        """
        Returns a normalised dict of social handles ready for prompts.
        Placeholder for real scraping later.
        """
        return {
            "instagram": self.parse_handle(business_data.get("instagram"), "instagram"),
            "twitter":   self.parse_handle(business_data.get("twitter"),   "twitter"),
            "website":   business_data.get("website"),
        }


social_service = SocialService()
