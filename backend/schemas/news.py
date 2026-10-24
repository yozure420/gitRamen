from typing import List, Optional

from pydantic import BaseModel


class NewsItemResponse(BaseModel):
    """更新情報1件。published_at は取得できない場合 None。"""

    source: str
    title: str
    url: str
    published_at: Optional[str] = None


class StatusComponentResponse(BaseModel):
    name: str
    status: str


class GithubStatusResponse(BaseModel):
    """githubstatus.com の全体状況と主要コンポーネントの状態。"""

    indicator: str
    description: str
    components: List[StatusComponentResponse] = []


class NewsResponse(BaseModel):
    git: List[NewsItemResponse] = []
    github: List[NewsItemResponse] = []
    gitramen: List[NewsItemResponse] = []
    status: Optional[GithubStatusResponse] = None
    # 取得に失敗したソース名（'git' / 'github' / 'gitramen' / 'status'）
    unavailable: List[str] = []
    fetched_at: str
