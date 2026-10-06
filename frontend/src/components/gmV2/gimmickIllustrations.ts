import type { GimmickIllustration } from '../../types/interface'
import stashImage from '../../assets/gimmick/manner_warikomi.png'
import resetSoftImage from '../../assets/gimmick/pose_ukkari_man.png'
import amendImage from '../../assets/gimmick/menu_tenin_yobu.png'
import reflogImage from '../../assets/gimmick/pose_syazai_sliding_dogeza_man.png'
import bisectImage from '../../assets/gimmick/ajimi_mazui_man.png'
import bisectCulpritImage from '../../assets/gimmick/tantei_hannin.png'
import plumbingImage from '../../assets/gimmick/ganko_oyaji.png'

/** イベント告知の挿絵（いらすとやの素材。ファイル名は配布元のまま） */
export const GIMMICK_ILLUSTRATIONS: Record<GimmickIllustration, string> = {
  stash: stashImage,
  reset_soft: resetSoftImage,
  amend: amendImage,
  reflog: reflogImage,
  bisect: bisectImage,
  bisect_culprit: bisectCulpritImage,
  plumbing: plumbingImage,
}
