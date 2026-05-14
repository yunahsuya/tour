/** 出國行李主清單（分類勾選）；id 用於本機勾選狀態 */
export const PACKING_CHECKLIST_SECTIONS = [
  {
    id: 'docs',
    title: '文件類',
    items: [
      { id: 'docs-passport', label: '護照' },
      { id: 'docs-visa', label: '簽證（批文）（免簽國家不用）' },
      { id: 'docs-photo', label: '2 吋照片 x2' },
      { id: 'docs-ticket', label: '機票證明' },
      { id: 'docs-insurance', label: '海外旅遊保險單' },
      { id: 'docs-hotel', label: '飯店訂單' },
    ],
  },
  {
    id: 'pay',
    title: '支付類',
    items: [
      { id: 'pay-twd', label: '台幣' },
      { id: 'pay-fx', label: '外幣' },
      { id: 'pay-card', label: '信用卡' },
    ],
  },
  {
    id: 'electronics',
    title: '電子用品',
    items: [
      { id: 'el-mobile', label: '手機' },
      { id: 'el-earphone', label: '耳機' },
      { id: 'el-charger', label: '充電器' },
      { id: 'el-intl-sim', label: '國際電話卡' },
      { id: 'el-sim-pin', label: 'SIM 卡針' },
      { id: 'el-camera', label: '相機' },
      { id: 'el-cam-charger', label: '相機充電器' },
      { id: 'el-tripod', label: '腳架' },
      { id: 'el-plug', label: '萬用插頭' },
      { id: 'el-pw', label: '行動電源（須隨身，見上方提醒）' },
    ],
  },
  {
    id: 'bags',
    title: '包包類',
    items: [
      { id: 'bags-suitcase', label: '行李箱' },
      { id: 'bags-case-key', label: '行李箱鑰匙' },
      { id: 'bags-carry', label: '隨身包' },
      { id: 'bags-wallet', label: '皮夾' },
      { id: 'bags-coin', label: '零錢包' },
      { id: 'bags-plastic', label: '塑膠袋' },
    ],
  },
  {
    id: 'carry-daily',
    title: '隨身用品',
    items: [
      { id: 'cd-alcohol', label: '酒精' },
      { id: 'cd-mask', label: '口罩' },
      { id: 'cd-tissue', label: '面紙' },
      { id: 'cd-period', label: '生理用品' },
      { id: 'cd-wipes', label: '濕紙巾' },
      { id: 'cd-umbrella', label: '雨傘' },
      { id: 'cd-sun', label: '防曬乳' },
      { id: 'cd-bottle', label: '水壺' },
    ],
  },
  {
    id: 'daily',
    title: '日用品',
    items: [
      { id: 'dy-glasses', label: '眼鏡' },
      { id: 'dy-glasscase', label: '眼鏡盒' },
      { id: 'dy-cl', label: '隱形眼鏡' },
      { id: 'dy-cl-sol', label: '隱形眼鏡藥水' },
      { id: 'dy-qtip', label: '棉花棒' },
      { id: 'dy-curl', label: '電捲棒' },
      { id: 'dy-brow', label: '修眉刀' },
    ],
  },
  {
    id: 'med',
    title: '藥物類',
    items: [
      { id: 'med-motion', label: '暈車藥' },
      { id: 'med-gi', label: '腸胃藥' },
      { id: 'med-pain', label: '止痛藥' },
      { id: 'med-bug', label: '蚊蟲藥' },
      { id: 'med-kit', label: '急救包' },
      { id: 'med-cold', label: '感冒藥等日常用藥' },
    ],
  },
  {
    id: 'toilet',
    title: '盥洗用品',
    items: [
      { id: 'to-cotton', label: '化妝棉' },
      { id: 'to-face-wash', label: '洗面乳' },
      { id: 'to-remove', label: '卸妝液' },
      { id: 'to-hair-cond', label: '護髮乳' },
      { id: 'to-toothbrush', label: '牙刷' },
      { id: 'to-toothpaste', label: '牙膏' },
      { id: 'to-towel', label: '毛巾' },
      { id: 'to-shave', label: '刮鬍刀（男）' },
    ],
  },
  {
    id: 'skincare',
    title: '保養品',
    items: [
      { id: 'sk-toner', label: '化妝水' },
      { id: 'sk-serum', label: '精華液' },
      { id: 'sk-lotion-f', label: '臉部乳液' },
      { id: 'sk-cream', label: '乳霜' },
      { id: 'sk-body', label: '身體乳液' },
    ],
  },
  {
    id: 'makeup',
    title: '彩妝品',
    items: [{ id: 'mk-free', label: '想帶什麼就帶什麼' }],
  },
  {
    id: 'clothes',
    title: '衣物類',
    items: [
      { id: 'cl-top', label: '上衣' },
      { id: 'cl-pants', label: '褲子' },
      { id: 'cl-skirt', label: '裙子' },
      { id: 'cl-swim', label: '泳衣' },
      { id: 'cl-pj', label: '睡衣' },
      { id: 'cl-bra', label: '內衣' },
      { id: 'cl-underpants', label: '內褲' },
      { id: 'cl-socks', label: '襪子' },
      { id: 'cl-jacket', label: '外套' },
      { id: 'cl-sandals', label: '涼鞋' },
      { id: 'cl-slippers', label: '拖鞋' },
      { id: 'cl-sneakers', label: '運動鞋' },
      { id: 'cl-flats', label: '平底鞋' },
    ],
  },
  {
    id: 'acc',
    title: '配件類',
    items: [
      { id: 'ac-sun', label: '太陽眼鏡' },
      { id: 'ac-hat', label: '遮陽帽' },
      { id: 'ac-jewel', label: '飾品' },
      { id: 'ac-hair', label: '髮飾' },
    ],
  },
]

export const PACKING_REFERENCE = {
  carryOnRules: {
    title: '隨身手提行李（例：越航）',
    note: '單件長寬高總和不超過 115cm，重量 7kg 內。每家航空公司不同，請以機票為準。',
    bullets: [
      '100ml 以下液體',
      '消毒用品：乾洗手、酒精棉片、75% 藥用酒精（容器裝妥且每樣不超過 100ml，並放入 1L 內透明可密封袋）',
      '行動電源／備用鋰電池（務必隨身）',
      '充電型暖暖包',
      '打火機（限一枚；藍焰防風打火機禁上機；中國、港澳禁攜帶）',
      '摺疊雨傘',
      '管徑 1 公分以下且收合後高度 60 公分以下：自拍棒、相機腳架',
      '嬰兒食品（牛奶）、液體藥品等須事先申報經同意後可隨身攜帶',
    ],
  },
  checkedRules: {
    title: '託運行李（例：越航）',
    note: '119cm × 119cm × 81cm，重量最多 20kg。每家航空公司體積／重量／件數不同。',
    bullets: [
      '100ml 以上液體（單一物品不超過 500ml，每人最多 2000ml）',
      '手機、平板、筆電、相機等電子產品（建議隨身攜帶）',
      '刀具（含指甲剪）',
      '長柄傘／摺疊雨傘',
      '運動用品（可能須額外加購）',
      '管徑 1 公分以上或收合後高度超過 60 公分：自拍棒、相機腳架',
    ],
  },
  prohibited: {
    title: '隨身／託運皆不可攜帶',
    bullets: ['火柴', '防狼噴霧', '催淚瓦斯', '電擊棒', '殺蟲劑', '鞭炮'],
  },
  carrySuggest: {
    title: '建議隨身重點（參考）',
    bullets: [
      '護照、2 吋照片×2（萬一遺失可補辦）、外幣、台幣、美金、信用卡',
      '簽證（免簽不需要）、APEC（有者記得帶）',
      '原子筆、機票證明、飯店證明',
      'SIM 卡、手機、耳機、行動電源（建議夾鏈袋）、充電器',
      '酒精（小於 100ml，夾鏈袋）、衛生紙、濕紙巾、口罩、衛生棉（女生）',
      '護手霜（小於 100ml）、水壺（安檢前倒掉水）',
      '暈車藥、備用藥（首日份量即可）',
      '墨鏡、薄外套、絲巾／圍巾、補妝、遮陽帽',
      '行李秤（若有電池請拔起夾鏈袋分裝）',
    ],
  },
  checkedSuggest: {
    title: '建議託運重點（參考）',
    bullets: [
      '衣服、褲子、內衣褲、襪子、睡衣',
      '刮鬍刀（男）、浴巾、毛巾、泳衣',
      '雨傘（建議用塑膠袋分裝以免弄濕其他物品）',
      '萬用轉接頭、熱水壺（注意電壓或 110V／220V 切換）',
      '拖鞋（洗澡）、穿搭用鞋子、眼鏡、隱形眼鏡與藥水、食鹽水',
      '棉花棒、塑膠袋（髒衣）、夾鏈袋',
      '化妝／卸妝、乳液、洗髮沐浴、洗面、護髮、髮油、牙膏牙刷、防曬',
      '暈車／腸胃／止痛／綜合感冒藥、OK 繃、優碘、個人用藥、貼布、透氣膠、紗布、小剪刀',
      '自拍棒（超過 60cm 須託運；有電池請拔起放隨身）',
      '零食、泡麵（注意是否含豬肉等入境規定）、免洗筷',
      '面紙、濕紙巾、衛生棉、梳子、衣架',
      '食用水果小刀、指甲剪、酒精（大瓶等依託運液體規定）',
    ],
  },
  notices: {
    title: '注意事項',
    bullets: [
      '隨身液體：分裝於不超過 100ml 容器，全部放入不超過 1L 透明拉鍊袋；總量不超過 1L（最多約 10 個 100ml）。',
      '託運液體：單瓶不超過 500ml，總量不超過 2L（實際以航空公司為準）。',
      '行李件數與公斤數請以機票為準（例如 23kg 一件或兩件等）。',
      '登機箱三邊和常見上限為不超過 115cm（以各航空公告為準）。',
    ],
  },
}

/** 參考區塊順序（與 UI 顯示一致） */
export const PACKING_REFERENCE_BLOCK_ORDER = [
  'carryOnRules',
  'checkedRules',
  'prohibited',
  'carrySuggest',
  'checkedSuggest',
  'notices',
]

/** 由預設 PACKING_REFERENCE 建立可編輯結構（含穩定 id） */
export function buildDefaultReferenceBlocks() {
  const out = {}
  for (const key of PACKING_REFERENCE_BLOCK_ORDER) {
    const src = PACKING_REFERENCE[key]
    if (!src) continue
    out[key] = {
      title: src.title,
      note: src.note ?? '',
      bullets: src.bullets.map((text, i) => ({
        id: `ref-${key}-seed-${i}`,
        text,
      })),
    }
  }
  return out
}
