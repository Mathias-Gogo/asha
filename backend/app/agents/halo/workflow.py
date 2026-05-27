from app.agents.halo.researcher import HaloResearcher
from app.agents.halo.analyzer import HaloAnalyzer
from app.services.social_service import social_service
from app.utils.logger import logger


async def halo_workflow(business_data: dict) -> dict:
    """
    Full Halo research pipeline:
      1. Parse social links
      2. Run DeepSeek research
      3. Analyse + normalise output
    """
    logger.info("Halo workflow started")

    social_context = social_service.extract_social_context(business_data)

    researcher = HaloResearcher()
    raw_research = await researcher.analyze_business(business_data, social_context)

    analyzer = HaloAnalyzer()
    research = analyzer.analyze(raw_research)

    logger.info("Halo workflow complete")
    return research
