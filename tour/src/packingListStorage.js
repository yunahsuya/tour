import {
  PACKING_CHECKLIST_SECTIONS,
  PACKING_REFERENCE_BLOCK_ORDER,
  buildDefaultReferenceBlocks,
} from './data/packingList.js'
import { PACKING_DEFAULT_PROFILE_ID, PACKING_PROFILES } from './constants/packingProfiles.js'
import { touchLocalDataSavedCookie } from './localDataMarker.js'

const KEY_V4 = 'tour-packing-state-v4'
const KEY_V3 = 'tour-packing-state-v3'
const KEY_V2 = 'tour-packing-checked-v2'

const SECTION_IDS = new Set(PACKING_CHECKLIST_SECTIONS.map((s) => s.id))
const PROFILE_IDS = new Set(PACKING_PROFILES.map((p) => p.id))

function emptyProfile() {
  return { checked: new Set(), customsBySection: {} }
}

function normalizeCustoms(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object') return out
  for (const sid of SECTION_IDS) {
    const list = raw[sid]
    if (!Array.isArray(list)) continue
    out[sid] = list
      .filter((x) => x && typeof x.id === 'string' && typeof x.label === 'string' && x.label.trim())
      .map((x) => ({ id: x.id.trim(), label: x.label.trim().slice(0, 200) }))
  }
  return out
}

function parseProfileSlice(data) {
  if (!data || typeof data !== 'object') return emptyProfile()
  const checked = new Set(
    Array.isArray(data.checked) ? data.checked.filter((x) => typeof x === 'string') : [],
  )
  return { checked, customsBySection: normalizeCustoms(data.customs) }
}

function serializeProfileSlice(slice) {
  const customs = {}
  for (const sid of SECTION_IDS) {
    const list = slice.customsBySection[sid]
    if (list?.length) customs[sid] = list
  }
  return { checked: [...slice.checked], customs }
}

function allProfilesEmpty() {
  const profiles = {}
  for (const { id } of PACKING_PROFILES) {
    profiles[id] = emptyProfile()
  }
  return profiles
}

export function newRefBulletId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `ref-bullet-${crypto.randomUUID()}`
  }
  return `ref-bullet-${Date.now()}`
}

function parseReferenceBlocks(raw) {
  const defaults = buildDefaultReferenceBlocks()
  if (!raw || typeof raw !== 'object') return defaults
  const out = {}
  for (const key of PACKING_REFERENCE_BLOCK_ORDER) {
    const b = raw[key]
    const def = defaults[key]
    if (!b || typeof b !== 'object') {
      out[key] = def
      continue
    }
    const title =
      typeof b.title === 'string' && b.title.trim()
        ? b.title.trim().slice(0, 200)
        : def.title
    const note = typeof b.note === 'string' ? b.note.slice(0, 1000) : def.note ?? ''

    const bullets = []
    if (Array.isArray(b.bullets)) {
      for (const row of b.bullets) {
        if (bullets.length >= 150) break
        if (row && typeof row === 'object' && typeof row.text === 'string' && row.text.trim()) {
          const id =
            typeof row.id === 'string' && row.id.trim()
              ? row.id.trim().slice(0, 100)
              : newRefBulletId()
          bullets.push({ id, text: row.text.trim().slice(0, 1500) })
        }
      }
    }
    out[key] = { title, note, bullets }
  }
  return out
}

function parseFullState(raw) {
  const p = JSON.parse(raw)
  const profiles = allProfilesEmpty()
  if (p.profiles && typeof p.profiles === 'object') {
    for (const { id } of PACKING_PROFILES) {
      profiles[id] = p.profiles[id] ? parseProfileSlice(p.profiles[id]) : emptyProfile()
    }
  }
  const active =
    typeof p.activeProfileId === 'string' && PROFILE_IDS.has(p.activeProfileId)
      ? p.activeProfileId
      : PACKING_DEFAULT_PROFILE_ID
  const referenceBlocks = parseReferenceBlocks(p.reference)
  return { activeProfileId: active, profiles, referenceBlocks }
}

export function persistPackingState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    const profiles = {}
    for (const { id } of PACKING_PROFILES) {
      profiles[id] = serializeProfileSlice(state.profiles[id] ?? emptyProfile())
    }
    const refObj = {}
    for (const key of PACKING_REFERENCE_BLOCK_ORDER) {
      const b = state.referenceBlocks?.[key]
      if (!b) continue
      refObj[key] = {
        title: typeof b.title === 'string' ? b.title : '',
        note: typeof b.note === 'string' ? b.note : '',
        bullets: Array.isArray(b.bullets)
          ? b.bullets.map(({ id, text }) => ({
              id: typeof id === 'string' ? id : newRefBulletId(),
              text: typeof text === 'string' ? text : '',
            }))
          : [],
      }
    }
    localStorage.setItem(
      KEY_V4,
      JSON.stringify({
        activeProfileId: state.activeProfileId,
        profiles,
        reference: refObj,
      }),
    )
    touchLocalDataSavedCookie()
  } catch {
    // ignore
  }
}

function migrateFromV3Single(raw3) {
  const old = JSON.parse(raw3)
  const checked = new Set(
    Array.isArray(old.checked) ? old.checked.filter((x) => typeof x === 'string') : [],
  )
  const customsBySection = normalizeCustoms(old.customs)
  const profiles = allProfilesEmpty()
  profiles[PACKING_DEFAULT_PROFILE_ID] = { checked, customsBySection }
  const state = {
    activeProfileId: PACKING_DEFAULT_PROFILE_ID,
    profiles,
    referenceBlocks: buildDefaultReferenceBlocks(),
  }
  persistPackingState(state)
  try {
    localStorage.removeItem(KEY_V3)
  } catch {
    // ignore
  }
  return state
}

function migrateFromV2(raw2) {
  const arr = JSON.parse(raw2)
  const checked = new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [])
  const profiles = allProfilesEmpty()
  profiles[PACKING_DEFAULT_PROFILE_ID] = { checked, customsBySection: {} }
  const state = {
    activeProfileId: PACKING_DEFAULT_PROFILE_ID,
    profiles,
    referenceBlocks: buildDefaultReferenceBlocks(),
  }
  persistPackingState(state)
  try {
    localStorage.removeItem(KEY_V2)
  } catch {
    // ignore
  }
  return state
}

export function loadPackingState() {
  if (typeof localStorage === 'undefined') {
    return {
      activeProfileId: PACKING_DEFAULT_PROFILE_ID,
      profiles: allProfilesEmpty(),
      referenceBlocks: buildDefaultReferenceBlocks(),
    }
  }
  try {
    const raw4 = localStorage.getItem(KEY_V4)
    if (raw4) return parseFullState(raw4)

    const raw3 = localStorage.getItem(KEY_V3)
    if (raw3) return migrateFromV3Single(raw3)

    const raw2 = localStorage.getItem(KEY_V2)
    if (raw2) return migrateFromV2(raw2)
  } catch {
    // ignore
  }
  return {
    activeProfileId: PACKING_DEFAULT_PROFILE_ID,
    profiles: allProfilesEmpty(),
    referenceBlocks: buildDefaultReferenceBlocks(),
  }
}

export function newCustomItemId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `pack-custom-${crypto.randomUUID()}`
  }
  return `pack-custom-${Date.now()}`
}
