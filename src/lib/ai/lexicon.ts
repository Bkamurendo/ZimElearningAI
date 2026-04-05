/**
 * Native Teacher Lexicon (Shona & Ndebele)
 * 
 * Maps ZIMSEC/HBC technical terms to natural, pedagogical expressions
 * used by experienced Zimbabwean teachers.
 */

export const NATIVE_LEXICON = {
  shona: {
    // ── Science & Tech ──────────────────────────────────────────────
    photosynthesis: 'Miti ichigadzira kudya kwazvo ichishandisa zuva (Photosynthesis)',
    skeleton: 'Mafupa emuviri anouya pamwechete (Skeletal system)',
    germination: 'Kumera kwembeu (Germination)',
    gravity: 'Simba rinodhonzera zvinhu kune pasi (Gravity)',
    energy: 'Simba rekuita basa (Energy)',
    bacteria: 'Tumbuyu tusingaonekwi nemaziso (Bacteria)',
    evaporation: 'Mvura inopanduka kuita mweya kupisa (Evaporation)',
    
    // ── Mathematics ─────────────────────────────────────────────────
    addition: 'Kusanganidza (Addition)',
    subtraction: 'Kubvisa (Subtraction)',
    multiplication: 'Kuwanza (Multiplication)',
    division: 'Kugovanisa (Division)',
    fractions: 'Zvikamu zvenhamba (Fractions)',
    geometry: 'Zvemasimba nezviumbwa (Geometry)',
    percentage: 'Zvikamu muzana (Percentage)',
    
    // ── Heritage & Social Science ──────────────────────────────────
    sovereignty: 'Kuzvitonga kuzere (Sovereignty)',
    heritage: 'Nhaka yenyika yedu (Heritage)',
    constitution: 'Bumbiro remitemo yenyika (Constitution)',
    patriotism: 'Kuda nyika (Patriotism)',
    governance: 'Matongerwo enyika (Governance)',
    
    // ── Pedagogical Honorifics & Nuance ─────────────────────────────
    greeting_student: 'Hesi mwanangu. Unodzidza zvakanaka nhasi.',
    encouragement: 'Zvakanaka chaizvo! Rambira ipapo.',
    difficulty_hint: 'Edza kufunga neimwe nzira. Ko kana tikaita seizvi...',
    summary_intro: 'Saka, mukupfupisa zvataidzidza...',
  },
  
  ndebele: {
    // ── Science & Tech ──────────────────────────────────────────────
    photosynthesis: 'Izihlahla zizenzela ukudla zisebenzisa ilanga (Photosynthesis)',
    skeleton: 'Amathambo omzimba ahlangene (Skeletal system)',
    germination: 'Ukumela kwembewu (Germination)',
    gravity: 'Amandla adonsela izinto phansi (Gravity)',
    energy: 'Amandla okwenza umsebenzi (Energy)',
    bacteria: 'Iziphilayo ezincane kakhulu ezingabonakaliyo (Bacteria)',
    evaporation: 'Amanzi ephenduka abe ngumoya ngokutshisa (Evaporation)',
    
    // ── Mathematics ─────────────────────────────────────────────────
    addition: 'Ukuhlanganisa (Addition)',
    subtraction: 'Ukususa (Subtraction)',
    multiplication: 'Ukwandisa (Multiplication)',
    division: 'Ukwaba (Division)',
    fractions: 'Izinxenye zenamba (Fractions)',
    geometry: 'Ngezibunjwa (Geometry)',
    percentage: 'Izilinganiso ngekhulu (Percentage)',
    
    // ── Heritage & Social Science ──────────────────────────────────
    sovereignty: 'Ukuzibusa okugcweleyo (Sovereignty)',
    heritage: 'Ifa lelizwe lethu (Heritage)',
    constitution: 'Isisekelo somthetho welizwe (Constitution)',
    patriotism: 'Ukuthanda ilizwe (Patriotism)',
    governance: 'Ukubusa ilizwe (Governance)',
    
    // ── Pedagogical Honorifics & Nuance ─────────────────────────────
    greeting_student: 'Sawubona mntanami. Sithembise ukuthi uzafunda kuhle namuhla.',
    encouragement: 'Kuhle kakhulu! Qhubeka njalo.',
    difficulty_hint: 'Zama ukucabanga ngenye indlela. Ake senze njalo...',
    summary_intro: 'Ngakho, ngokufingqiwe esikufunde...',
  }
} as const;

export type LexiconLanguage = keyof typeof NATIVE_LEXICON;
