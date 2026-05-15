/** @typedef {{ label: string, href: string }} TripLink */
/** @typedef {{ type: 'stay'|'block'|'activity', time?: string, title: string, detail?: string, mapUrl?: string, links?: TripLink[], emphasis?: 'question'|'alert'|'booking', regionTag?: string }} TripItem */
/** @typedef {{ id: string, label: string, subtitle?: string, items: TripItem[] }} TripDay */

/** 整趟旅程共用的 Google Drive 資料夾 */
export const tripDriveLinks = [
  { label: '證件', href: 'https://drive.google.com/drive/folders/1mDfmhgRYscrsvhI6PY8SJIgLGieik5Pj' },
  { label: '訂位/票券', href: 'https://drive.google.com/drive/folders/13WZA2Nhrd0ms3bnN3WkyVxz1cLmpX-ZQ' },
  { label: '機票', href: 'https://drive.google.com/drive/folders/1HBqZNNU6W-Y2jYHuce0l5Hqup6QylDqJ' },
  { label: '住宿', href: 'https://drive.google.com/drive/folders/1X0a38GZxkc0ZXJnVwLQ7elinHshHlDB2' },
]

/** @type {{ id: string, name: string, flag: string, code: string, days: TripDay[] }[]} */
export const regions = [
  {
    id: 'taiwan',
    name: '台灣（桃園過境、去程與返抵）',
    flag: '🇹🇼',
    code: 'TW',
    days: [
      {
        id: '2026-05-15',
        label: '5/15（四）',
        subtitle: '桃園過境',
        items: [
          {
            type: 'stay',
            title: 'City Suites Taoyuan Gateway',
            detail: '住宿',
          },
          {
            type: 'activity',
            time: '19:55 – 20:30',
            title: '落地台北 + 領行李',
          },
          {
            type: 'activity',
            time: '21:30 – 22:00',
            title: '機捷 A6 泰山貴和站會合',
          },
          {
            type: 'activity',
            time: '22:00 – 22:30',
            title: '機捷 A15 大園站 → City Suites Taoyuan Gateway 入住',
          },
        ],
      },
      {
        id: '2026-05-16',
        label: '5/16（五）',
        subtitle: '出發往倫敦',
        items: [
          {
            type: 'activity',
            time: '11:00 – 12:00',
            title: '退房',
          },
          {
            type: 'activity',
            time: '12:30 – 16:40',
            title: '機場第二航廈：吃飯 / 休息 / 整理行李 / 最後採買',
          },
          {
            type: 'activity',
            time: '16:40 – 19:40',
            title: '報到 / 候機 / 起飛',
          },
        ],
      },
      {
        id: '2026-05-25-tw',
        label: '5/25（一）',
        subtitle: '返抵台灣',
        items: [
          {
            type: 'activity',
            title: '航程／抵達航點機場',
            detail: '台北松山（TSA）或 金門（KNH）· 入境、出關、領行李',
          },
          {
            type: 'activity',
            title: '返台',
            detail: '結束韓國行程',
          },
        ],
      },
    ],
  },
  {
    id: 'london',
    name: '倫敦（含劍橋一日）',
    flag: '🇬🇧',
    code: 'GB',
    days: [
      {
        id: '2026-05-17',
        label: '5/17（六）',
        subtitle: '抵達倫敦',
        items: [
          {
            type: 'stay',
            title: 'Clarence Gate Gardens',
            detail: 'Flat 31, 5 Siddons Ln, London, UK',
          },
          {
            type: 'activity',
            time: '00:55 – 02:20',
            title: '阿布達比轉機',
          },
          {
            type: 'activity',
            time: '02:20 – 07:00',
            title: '飛行',
          },
          {
            type: 'activity',
            time: '07:00 – 08:30',
            title: '落地希斯洛 T4 / 出關 / 領行李',
          },
          {
            type: 'activity',
            time: '08:30 – 09:40',
            title: '前往住宿地點？',
            emphasis: 'question',
          },
          {
            type: 'activity',
            time: '09:40 – 10:00',
            title: 'Radical Storage — Luggage storage Marylebone',
            detail: '行李若不能寄放 BnB 則放付費寄放處？',
            emphasis: 'question',
          },
          {
            type: 'activity',
            time: '10:30 – 12:00',
            title: 'Buckingham Palace',
            detail: '提前卡位，衛兵交接 11:00 開始',
          },
          {
            type: 'activity',
            time: '12:30 – 14:00',
            title: 'Blacklock（現場排）或 Hawksmoor Air Street（已訂 12:45）',
            detail: '英式傳統週日限定 Sunday Roast',
            emphasis: 'booking',
            links: [
              {
                label: '訂位確認（OpenTable）',
                href: 'https://www.opentable.co.uk/booking/confirmation?availabilityToken=eyJ2IjozLCJtIjowLCJwIjowLCJjIjo2LCJzIjowLCJuIjowfQ&creditCardRequired=false&dateTime=2026-05-17T12%3A30&partySize=4&points=100&pointsType=Standard&resoAttribute=unselected&rid=92079&slotHash=3832035417&confirmationNumber=2110641485&securityToken=01HMEqX_W32uYvAufX7HHFTcBmbpprialBEravQ6ssBYw1&isModify=true&isMandatory=false&cfe=true&tableCategory=default&diningAreaId=81481',
              },
              {
                label: '午餐截圖（Google Drive）',
                href: 'https://drive.google.com/file/d/1Bnx5NjV0g9F-KAiJOuUarSwxlCGKfIm6/view?usp=drive_link',
              },
            ],
          },
          {
            type: 'activity',
            time: '14:30 – 17:00',
            title: 'The British Museum',
            detail: '票證檔名：17 May Visit - The British Museum.pdf',
          },
          {
            type: 'activity',
            time: '17:00 – 18:00',
            title: 'Oxford St',
          },
          {
            type: 'activity',
            time: '18:00 – 19:30',
            title: 'Selfridges',
            detail: '買茶葉、伴手禮 / Jelly Cat',
          },
          {
            type: 'block',
            title: '看阿姨約在哪一起吃晚餐？',
            emphasis: 'question',
          },
        ],
      },
      {
        id: '2026-05-18',
        label: '5/18（日）',
        subtitle: '劍橋一日',
        items: [
          {
            type: 'stay',
            title: 'Clarence Gate Gardens',
            detail: 'Flat 31, 5 Siddons Ln, London, UK',
          },
          {
            type: 'activity',
            time: '08:00 – 09:30',
            title: 'Sandwich Street Kitchen Kings Cross',
            detail:
              '英早 Full English（Bacon, sausage, 2 fried eggs, hash browns, baked beans, grilled tomato, portobello mushroom, buttered toast）£17.50',
          },
          {
            type: 'activity',
            title: "King's Cross 火車去劍橋",
            detail:
              '哈利波特月台為付費排隊拍照處，沒有真的 9¾ 月台；可回程到站再拍。',
            emphasis: 'alert',
          },
          {
            type: 'activity',
            time: '12:00 – 12:50',
            title: 'Wren Library',
            detail: 'Mon 12pm–2pm',
            links: [
              {
                label: 'Trinity College 訪客資訊',
                href: 'https://www.trin.cam.ac.uk/library/visitors/',
              },
            ],
          },
          {
            type: 'activity',
            time: '13:00 – 16:00',
            title: "King's College, Cambridge",
            detail: '中文導覽',
          },
          {
            type: 'activity',
            time: '16:00 – 16:20',
            title: "Newton's Apple Tree",
          },
          {
            type: 'activity',
            time: '16:30 – 16:45',
            title: "Jack's Gelato",
          },
          {
            type: 'activity',
            time: '17:00 – 17:50',
            title: "Scudamore's Mill Lane Punting Station",
            detail: '遊船 + 走去餐廳',
          },
          {
            type: 'activity',
            time: '19:15 – 20:45',
            title: 'Bedouin',
            detail: '吃飯時再訂回程車票 · 截圖：18 May Dinner - bedouin cambridge.png',
          },
        ],
      },
      {
        id: '2026-05-19',
        label: '5/19（一）',
        subtitle: '倫敦市區',
        items: [
          {
            type: 'stay',
            title: 'Clarence Gate Gardens',
            detail: 'Flat 31, 5 Siddons Ln, London, UK',
          },
          {
            type: 'activity',
            time: '08:00 – 09:00',
            title: '出門',
          },
          {
            type: 'activity',
            time: '09:00 – 10:00',
            title: 'Sky Garden',
          },
          {
            type: 'activity',
            time: '10:00 – 11:00',
            title: 'Tower Bridge',
          },
          {
            type: 'activity',
            time: '11:30 – 12:55',
            title: 'Borough Market',
          },
          {
            type: 'activity',
            time: '13:15 – 15:00',
            title: 'Westminster Abbey',
          },
          {
            type: 'activity',
            time: '15:15 – 16:00',
            title: 'Big Ben & London Eye',
          },
          {
            type: 'activity',
            time: '16:30 – 20:00',
            title: '典禮 check in — Royal Festival Hall',
          },
          {
            type: 'activity',
            time: '20:00 –',
            title: '約吃飯',
          },
        ],
      },
      {
        id: '2026-05-20-am',
        label: '5/20（二）',
        subtitle: '倫敦上午 → 飛巴塞隆納',
        items: [
          {
            type: 'activity',
            time: '09:00 – 09:30（選）',
            title: 'Daunt Books Marylebone',
          },
        ],
      },
    ],
  },
  {
    id: 'barcelona',
    name: '巴塞隆納',
    flag: '🇪🇸',
    code: 'ES',
    days: [
      {
        id: '2026-05-20-bcn',
        label: '5/20（三）',
        subtitle: 'LTN → BCN',
        items: [
          {
            type: 'activity',
            time: '12:45 – 15:55',
            title: 'Wizz 航空：倫敦 LTN → 巴塞隆納 BCN',
          },
          {
            type: 'activity',
            time: '15:55 – 17:00',
            title: '出關 + 領行李',
          },
          {
            type: 'activity',
            time: '17:00 – 17:35',
            title: '地鐵前往住宿',
            detail: '交通卡：T-familiar card',
          },
          {
            type: 'activity',
            time: '17:35 – 18:35',
            title: '入住 + 休息',
          },
          {
            type: 'activity',
            time: '19:00 – 21:00',
            title: '晚餐 Cerveceria Catalana',
            detail: '現場登記候位',
          },
          {
            type: 'activity',
            time: '21:00 –',
            title: '散步、超市，或回住宿休息',
          },
        ],
      },
      {
        id: '2026-05-21',
        label: '5/21（四）',
        subtitle: '高第與舊城',
        items: [
          {
            type: 'activity',
            time: '09:00 – 12:00',
            title: '巴特婁之家 Casa Batlló',
            detail: '訂票（TWD 930）。原表列在 5/20 區塊，與當日下午抵達衝突，此處依「抵達翌日上午」編排。',
            emphasis: 'booking',
          },
          {
            type: 'activity',
            time: '09:30 – 10:30',
            title: 'Mercat de Santa Caterina',
            detail: '市場早午餐（若與上一段重疊，請自行微調時段）',
          },
          {
            type: 'block',
            title: '吃飯（中段）',
          },
          {
            type: 'activity',
            time: '13:00 – 16:30',
            title: '歌德區',
            detail:
              'El món neix en cada besada · Cathedral of Barcelona · Pont del Bisbe',
          },
          {
            type: 'activity',
            title: 'Jon Cake',
            detail: '巴斯克起司蛋糕，推 Brie；建議提早預約',
            links: [
              { label: 'Jon Cake 預約', href: 'https://joncake.last.shop/en/' },
            ],
          },
          {
            type: 'activity',
            title: 'Xurreria Laietana',
            detail: '西班牙油條',
          },
          {
            type: 'activity',
            time: '17:00 – 19:00',
            title: '渡輪 Muelle De Drassanes → Bus Nàtic ALSA 看海',
            detail: '現場購票；末班約 19:00（亦有 21:30 說法）',
            links: [
              { label: 'Bus Nàtic by ALSA', href: 'https://www.busnautic.es/' },
            ],
          },
          {
            type: 'activity',
            time: '19:30 – 21:00',
            title: '吃飯',
          },
          {
            type: 'activity',
            time: '21:30 – 22:00',
            title: 'Magic Fountain',
            detail: 'Pl. de Carles Buïgas, 1 · 展演週三至週六等，請查官網時段',
            links: [
              {
                label: '噴泉展演時間',
                href: 'https://www.barcelona.cat/en/what-to-do-in-bcn/magic-fountain/magic-fountains-show-times',
              },
            ],
          },
        ],
      },
      {
        id: '2026-05-22',
        label: '5/22（五）',
        subtitle: '聖家堂與 Tibidabo',
        items: [
          {
            type: 'activity',
            time: '10:00 – 10:30',
            title: '早餐',
          },
          {
            type: 'activity',
            time: '11:00 – 13:00',
            title: 'Sagrada Família',
            detail: 'Basílica de la Sagrada Família · 訂票（TWD 969）',
            emphasis: 'booking',
          },
          {
            type: 'activity',
            time: '13:00 – 15:00',
            title: '吃飯',
          },
          {
            type: 'activity',
            time: '15:30 – 18:30',
            title: 'Tibidabo 日落',
            detail:
              '地鐵 S1/S2 → Peu del Funicular → 纜車（末班 18:15）→ 111 公車上山頂',
            emphasis: 'alert',
          },
        ],
      },
    ],
  },
  {
    id: 'seoul',
    name: '首爾（仁川入境）',
    flag: '🇰🇷',
    code: 'KR',
    days: [
      {
        id: '2026-05-24',
        label: '5/24（日）',
        subtitle: '阿布達比 AUH → 仁川 ICN',
        items: [
          {
            type: 'stay',
            title: 'L7 HONGDAE by LOTTE HOTELS',
            detail: '住宿地點（弘大）',
          },
          {
            type: 'activity',
            title: 'Etihad Airways EY822',
            detail: '阿拉伯聯合大公國阿布達比 · 扎耶德機場（AUH）→ 韓國首爾仁川機場（ICN）',
            emphasis: 'booking',
          },
          {
            type: 'activity',
            title: '首爾仁川（ICN）機場',
            detail: '入境、出關、領行李',
          },
          {
            type: 'activity',
            time: '10:50',
            title: '抵達仁川（ICN）',
            detail: '依實際航班微調時段',
          },
          {
            type: 'activity',
            title: '弘大商圈逛街',
          },
        ],
      },
      {
        id: '2026-05-25',
        label: '5/25（一）',
        subtitle: '返國 · 金浦 GMP',
        items: [
          {
            type: 'stay',
            title: 'L7 HONGDAE by LOTTE HOTELS',
            detail: '退房、前往金浦機場（依實際航班調整）',
          },
          {
            type: 'activity',
            title: '返國',
            detail: '韓國首爾金浦機場（GMP）出發 → 台北松山（TSA）或 金門（KNH）機場（依實際機票）',
          },
          {
            type: 'activity',
            title: '首爾金浦（GMP）機場',
            detail: '報到、候機、登機',
          },
        ],
      },
    ],
  },
]

/** 同日多段 id 後綴時的排序（數字愈大愈晚） */
const DAY_ID_SUFFIX_ORDER = { am: 1, bcn: 2, tw: 3 }

/**
 * @param {string} dayId
 * @returns {[number, number, string]}
 */
function chronTupleForDayId(dayId) {
  const id = String(dayId)
  const m = id.match(/^(\d{4})-(\d{2})-(\d{2})(?:-([a-z0-9]+))?$/i)
  if (!m) return [0, 0, id]
  const n = parseInt(m[1], 10) * 10000 + parseInt(m[2], 10) * 100 + parseInt(m[3], 10)
  const suf = (m[4] ?? '').toLowerCase()
  const ord = DAY_ID_SUFFIX_ORDER[suf] ?? (suf ? 50 : 0)
  return [n, ord, id]
}

/**
 * @param {typeof regions} [data]
 */
export function flattenDays(data = regions) {
  const pairs = data.flatMap((r) => r.days.map((d) => ({ region: r, day: d })))
  pairs.sort((a, b) => {
    const [na, oa, ia] = chronTupleForDayId(a.day.id)
    const [nb, ob, ib] = chronTupleForDayId(b.day.id)
    if (na !== nb) return na - nb
    if (oa !== ob) return oa - ob
    return ia.localeCompare(ib)
  })
  return pairs
}
