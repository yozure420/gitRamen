from fastapi import APIRouter

from news import fetch_news
from schemas.news import NewsResponse

router = APIRouter()


@router.get("", response_model=NewsResponse)
@router.get("/", response_model=NewsResponse, include_in_schema=False)
async def get_news() -> NewsResponse:
    """Git / GitHub / GitRamen の更新情報と GitHub の稼働状況を返す。

    結果は既定で10分キャッシュする。認証なしの公開エンドポイントなので、
    外部 API のレート制限を使い切られないよう、呼び出し側からはキャッシュを迂回させない。
    """
    payload = await fetch_news()
    return NewsResponse(**payload)
