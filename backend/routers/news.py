from fastapi import APIRouter

from news import fetch_news
from schemas.news import NewsResponse

router = APIRouter()


@router.get("", response_model=NewsResponse)
@router.get("/", response_model=NewsResponse, include_in_schema=False)
async def get_news(refresh: bool = False) -> NewsResponse:
    """Git / GitHub / GitRamen の更新情報と GitHub の稼働状況を返す。

    結果は既定で10分キャッシュする。refresh=true で取り直す。
    """
    payload = await fetch_news(use_cache=not refresh)
    return NewsResponse(**payload)
