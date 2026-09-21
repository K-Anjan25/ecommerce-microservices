import { POSTAL_CODE_RE } from "./countries";

/**
 * Country-specific address structure.
 *
 * Every country gets a form that matches how its addresses actually work:
 * the first-level territory divisions (states, emirates, cantons,
 * prefectures…), the local labels, and the real postal/phone formats.
 * Countries without a universal postal system (Gulf states, Maldives) mark
 * the postal field optional instead of pretending it exists.
 */
export interface Territory {
  /** Label for the first-level division: State / Emirate / Canton / … */
  regionLabel: string;
  /** First-level divisions to pick from; undefined → free-text field. */
  regions?: string[];
  /** City-state (Singapore): no division field at all. */
  regionHidden?: boolean;
  /** Value stored when the division field is hidden. */
  defaultRegion?: string;
  /** Label for the settlement field: City / District / Town / Island… */
  cityLabel: string;
  cityExample?: string;
  /** Postal field label: PIN code / ZIP code / Postcode / … */
  postalLabel: string;
  postalExample?: string;
  /** Local format; undefined → no universal postal code (field optional). */
  postalRegex?: RegExp;
  /** Input hint for the postal field. */
  postalNumeric?: boolean;
  postalMax?: number;
  /** Local phone format (without the dial code). */
  phoneRegex: RegExp;
  phoneExample: string;
}

const GENERIC_PHONE = /^\d{6,14}$/;

const TERRITORIES: Record<string, Territory> = {
  IN: {
    regionLabel: "State",
    cityLabel: "District",
    postalLabel: "PIN code",
    postalExample: "6-digit pincode",
    postalRegex: /^\d{6}$/,
    postalNumeric: true,
    postalMax: 6,
    phoneRegex: /^[6-9]\d{9}$/,
    phoneExample: "10-digit mobile",
  },
  US: {
    regionLabel: "State",
    regions: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
      "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
      "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
      "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
      "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
      "New Hampshire", "New Jersey", "New Mexico", "New York",
      "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
      "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
      "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
    ],
    cityLabel: "City",
    cityExample: "e.g. San Jose",
    postalLabel: "ZIP code",
    postalExample: "e.g. 95014",
    postalRegex: /^\d{5}(-\d{4})?$/,
    postalNumeric: true,
    postalMax: 10,
    phoneRegex: /^\d{10}$/,
    phoneExample: "10-digit phone",
  },
  CA: {
    regionLabel: "Province",
    regions: [
      "Alberta", "British Columbia", "Manitoba", "New Brunswick",
      "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
      "Nunavut", "Ontario", "Prince Edward Island", "Quebec",
      "Saskatchewan", "Yukon",
    ],
    cityLabel: "City",
    cityExample: "e.g. Toronto",
    postalLabel: "Postal code",
    postalExample: "e.g. M5V 2T6",
    postalRegex: /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/,
    postalMax: 7,
    phoneRegex: /^\d{10}$/,
    phoneExample: "10-digit phone",
  },
  GB: {
    regionLabel: "Region",
    regions: ["England", "Scotland", "Wales", "Northern Ireland"],
    cityLabel: "Town / City",
    cityExample: "e.g. London",
    postalLabel: "Postcode",
    postalExample: "e.g. SW1A 1AA",
    postalRegex: /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/,
    postalMax: 8,
    phoneRegex: /^\d{7,10}$/,
    phoneExample: "e.g. 20 7946 0958",
  },
  AU: {
    regionLabel: "State",
    regions: [
      "New South Wales", "Victoria", "Queensland", "Western Australia",
      "South Australia", "Tasmania", "Australian Capital Territory",
      "Northern Territory",
    ],
    cityLabel: "Suburb / City",
    cityExample: "e.g. Sydney",
    postalLabel: "Postcode",
    postalExample: "e.g. 2000",
    postalRegex: /^\d{4}$/,
    postalNumeric: true,
    postalMax: 4,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit phone",
  },
  NZ: {
    regionLabel: "Region",
    regions: [
      "Northland", "Auckland", "Waikato", "Bay of Plenty", "Gisborne",
      "Hawke's Bay", "Taranaki", "Manawatū-Whanganui", "Wellington",
      "Tasman", "Nelson", "Marlborough", "West Coast", "Canterbury",
      "Otago", "Southland",
    ],
    cityLabel: "City",
    cityExample: "e.g. Wellington",
    postalLabel: "Postcode",
    postalExample: "e.g. 6011",
    postalRegex: /^\d{4}$/,
    postalNumeric: true,
    postalMax: 4,
    phoneRegex: /^\d{8,10}$/,
    phoneExample: "e.g. 4 499 4444",
  },
  AE: {
    regionLabel: "Emirate",
    regions: [
      "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain",
      "Ras Al Khaimah", "Fujairah",
    ],
    cityLabel: "City / Area",
    cityExample: "e.g. Deira, Dubai",
    postalLabel: "Postal code (optional)",
    postalExample: "Makani / area code",
    // The UAE has no universal postal codes — couriers work off area + phone.
    phoneRegex: /^\d{7,9}$/,
    phoneExample: "e.g. 501234567",
  },
  SG: {
    regionLabel: "Region",
    regionHidden: true,
    defaultRegion: "Singapore",
    cityLabel: "City",
    cityExample: "Singapore",
    postalLabel: "Postal code",
    postalExample: "6-digit code",
    postalRegex: /^\d{6}$/,
    postalNumeric: true,
    postalMax: 6,
    phoneRegex: /^\d{8}$/,
    phoneExample: "8-digit number",
  },
  JP: {
    regionLabel: "Prefecture",
    regions: [
      "Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka",
      "Fukushima", "Gifu", "Gunma", "Hiroshima", "Hokkaido", "Hyogo",
      "Ibaraki", "Ishikawa", "Iwate", "Kagawa", "Kagoshima", "Kanagawa",
      "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki", "Nagano",
      "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka",
      "Saga", "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi",
      "Tokushima", "Tokyo", "Tottori", "Toyama", "Wakayama", "Yamagata",
      "Yamaguchi", "Yamanashi",
    ],
    cityLabel: "City / Ward",
    cityExample: "e.g. Shibuya, Tokyo",
    postalLabel: "Postal code",
    postalExample: "e.g. 100-0001",
    postalRegex: /^\d{3}-?\d{4}$/,
    postalNumeric: true,
    postalMax: 8,
    phoneRegex: /^\d{9,10}$/,
    phoneExample: "e.g. 312345678",
  },
  KR: {
    regionLabel: "City / Province",
    regions: [
      "Seoul", "Busan", "Daegu", "Incheon", "Gwangju", "Daejeon", "Ulsan",
      "Sejong", "Gyeonggi", "Gangwon", "North Chungcheong",
      "South Chungcheong", "North Jeolla", "South Jeolla",
      "North Gyeongsang", "South Gyeongsang", "Jeju",
    ],
    cityLabel: "District / City",
    cityExample: "e.g. Gangnam-gu",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{9,10}$/,
    phoneExample: "10-digit mobile",
  },
  DE: {
    regionLabel: "State",
    regions: [
      "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen",
      "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern",
      "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland",
      "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia",
    ],
    cityLabel: "City",
    cityExample: "e.g. Berlin",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{6,11}$/,
    phoneExample: "e.g. 3012345678",
  },
  FR: {
    regionLabel: "Region",
    regions: [
      "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany",
      "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France",
      "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie",
      "Pays de la Loire", "Provence-Alpes-Côte d'Azur", "Guadeloupe",
      "Martinique", "French Guiana", "Réunion", "Mayotte",
    ],
    cityLabel: "City",
    cityExample: "e.g. Paris",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit phone",
  },
  NL: {
    regionLabel: "Province",
    regions: [
      "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen",
      "Limburg", "North Brabant", "North Holland", "Overijssel", "Utrecht",
      "Zeeland", "South Holland",
    ],
    cityLabel: "City",
    cityExample: "e.g. Amsterdam",
    postalLabel: "Postal code",
    postalExample: "e.g. 1011 AC",
    postalRegex: /^\d{4}\s?[A-Za-z]{2}$/,
    postalMax: 7,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit phone",
  },
  BE: {
    regionLabel: "Region",
    regions: ["Brussels-Capital", "Flanders", "Wallonia"],
    cityLabel: "City",
    cityExample: "e.g. Antwerp",
    postalLabel: "Postal code",
    postalExample: "4-digit code",
    postalRegex: /^\d{4}$/,
    postalNumeric: true,
    postalMax: 4,
    phoneRegex: /^\d{8,9}$/,
    phoneExample: "9-digit phone",
  },
  ES: {
    regionLabel: "Community",
    regions: [
      "Andalusia", "Aragon", "Asturias", "Balearic Islands",
      "Basque Country", "Canary Islands", "Cantabria", "Castile and León",
      "Castile-La Mancha", "Catalonia", "Extremadura", "Galicia",
      "La Rioja", "Madrid", "Murcia", "Navarre", "Valencian Community",
    ],
    cityLabel: "City",
    cityExample: "e.g. Barcelona",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit phone",
  },
  SE: {
    regionLabel: "County",
    regions: [
      "Stockholm", "Västra Götaland", "Skåne", "Uppsala", "Västmanland",
      "Örebro", "Östergötland", "Södermanland", "Jönköping", "Kronoberg",
      "Kalmar", "Gotland", "Blekinge", "Halland", "Gävleborg", "Dalarna",
      "Värmland", "Västernorrland", "Jämtland", "Västerbotten",
      "Norrbotten",
    ],
    cityLabel: "City",
    cityExample: "e.g. Stockholm",
    postalLabel: "Postal code",
    postalExample: "e.g. 114 55",
    postalRegex: /^\d{3}\s?\d{2}$/,
    postalNumeric: true,
    postalMax: 6,
    phoneRegex: /^\d{7,10}$/,
    phoneExample: "e.g. 81234567",
  },
  CH: {
    regionLabel: "Canton",
    regions: [
      "Aargau", "Appenzell Ausserrhoden", "Appenzell Innerrhoden",
      "Basel-Landschaft", "Basel-Stadt", "Bern", "Fribourg", "Geneva",
      "Glarus", "Graubünden", "Jura", "Lucerne", "Neuchâtel", "Nidwalden",
      "Obwalden", "Schaffhausen", "Schwyz", "Solothurn", "St. Gallen",
      "Thurgau", "Ticino", "Uri", "Valais", "Vaud", "Zug", "Zürich",
    ],
    cityLabel: "City",
    cityExample: "e.g. Zurich",
    postalLabel: "Postal code",
    postalExample: "4-digit code",
    postalRegex: /^\d{4}$/,
    postalNumeric: true,
    postalMax: 4,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit phone",
  },
  ZA: {
    regionLabel: "Province",
    regions: [
      "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
      "Mpumalanga", "North West", "Northern Cape", "Western Cape",
    ],
    cityLabel: "City / Suburb",
    cityExample: "e.g. Cape Town",
    postalLabel: "Postal code",
    postalExample: "4-digit code",
    postalRegex: /^\d{4}$/,
    postalNumeric: true,
    postalMax: 4,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit number",
  },
  LK: {
    regionLabel: "Province",
    regions: [
      "Central", "Eastern", "North Central", "Northern", "North Western",
      "Sabaragamuwa", "Southern", "Uva", "Western",
    ],
    cityLabel: "City",
    cityExample: "e.g. Colombo",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{9}$/,
    phoneExample: "9-digit number",
  },
  NP: {
    regionLabel: "Province",
    regions: [
      "Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali",
      "Sudurpashchim",
    ],
    cityLabel: "City",
    cityExample: "e.g. Kathmandu",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{6,10}$/,
    phoneExample: "e.g. 9812345678",
  },
  TH: {
    regionLabel: "Province",
    regions: [
      "Ang Thong", "Bueng Kan", "Buri Ram", "Chachoengsao", "Chai Nat",
      "Chaiyaphum", "Chanthaburi", "Chiang Mai", "Chiang Rai", "Chonburi",
      "Chumphon", "Kalasin", "Kamphaeng Phet", "Kanchanaburi", "Khon Kaen",
      "Krabi", "Lampang", "Lamphun", "Loei", "Lopburi", "Mae Hong Son",
      "Maha Sarakham", "Mukdahan", "Nakhon Nayok", "Nakhon Phanom",
      "Nakhon Pathom", "Nakhon Ratchasima", "Nakhon Sawan",
      "Nakhon Si Thammarat", "Nan", "Narathiwat", "Nong Bua Lamphu",
      "Nonthaburi", "Pathum Thani", "Pattani", "Phang Nga", "Phatthalung",
      "Phayao", "Phetchabun", "Phetchaburi", "Phichit", "Phitsanulok",
      "Phra Nakhon Si Ayutthaya", "Phrae", "Phuket", "Prachinburi",
      "Prachuap Khiri Khan", "Ranong", "Ratchaburi", "Rayong", "Roi Et",
      "Sa Kaeo", "Sakon Nakhon", "Samut Prakan", "Samut Sakhon",
      "Samut Songkhram", "Saraburi", "Satun", "Sing Buri", "Si Sa Ket",
      "Songkhla", "Sukhothai", "Suphan Buri", "Surat Thani", "Surin",
      "Tak", "Trang", "Trat", "Ubon Ratchathani", "Udon Thani",
      "Uthai Thani", "Uttaradit", "Yala", "Yasothon",
    ],
    cityLabel: "City / District",
    cityExample: "e.g. Bang Rak",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{8,9}$/,
    phoneExample: "e.g. 812345678",
  },
  MY: {
    regionLabel: "State",
    regions: [
      "Johor", "Kedah", "Kelantan", "Kuala Lumpur", "Labuan", "Melaka",
      "Negeri Sembilan", "Pahang", "Penang", "Perak", "Perlis",
      "Putrajaya", "Sabah", "Sarawak", "Selangor", "Terengganu",
    ],
    cityLabel: "City",
    cityExample: "e.g. Kuala Lumpur",
    postalLabel: "Postal code",
    postalExample: "5-digit code",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{7,10}$/,
    phoneExample: "e.g. 312345678",
  },
  MU: {
    regionLabel: "District",
    regions: [
      "Port Louis", "Pamplemousses", "Rivière du Rempart", "Flacq",
      "Grand Port", "Moka", "Plaines Wilhems", "Black River", "Savanne",
    ],
    cityLabel: "City / Town",
    cityExample: "e.g. Port Louis",
    postalLabel: "Postal code (optional)",
    postalExample: "e.g. 11328",
    postalRegex: /^\d{4,5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{7,8}$/,
    phoneExample: "e.g. 5 123 4567",
  },
  BH: {
    regionLabel: "Governorate",
    regions: ["Capital", "Muharraq", "Northern", "Southern"],
    cityLabel: "City / Area",
    cityExample: "e.g. Manama",
    postalLabel: "Postal code (optional)",
    phoneRegex: /^\d{8}$/,
    phoneExample: "8-digit number",
  },
  KW: {
    regionLabel: "Governorate",
    regions: [
      "Al Asimah", "Hawalli", "Farwaniya", "Ahmadi", "Jahra",
      "Mubarak Al-Kabeer",
    ],
    cityLabel: "City / Area",
    cityExample: "e.g. Salmiya",
    postalLabel: "Postal code (optional)",
    // Kuwait is phasing in a national postcode; P.O. boxes are still the norm.
    phoneRegex: /^\d{8}$/,
    phoneExample: "8-digit number",
  },
  QA: {
    regionLabel: "Municipality",
    regions: [
      "Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Al Shahaniya",
      "Umm Salal", "Al Daayen", "Al Shamal",
    ],
    cityLabel: "City / Zone",
    cityExample: "e.g. West Bay, Doha",
    postalLabel: "Postal code (optional)",
    // Qatar has no postal codes; addresses use zone numbers.
    phoneRegex: /^\d{8}$/,
    phoneExample: "8-digit number",
  },
  OM: {
    regionLabel: "Governorate",
    regions: [
      "Muscat", "Dhofar", "Musandam", "Al Buraimi", "Ad Dakhiliyah",
      "Al Batinah North", "Al Batinah South", "Ash Sharqiyah North",
      "Ash Sharqiyah South", "Ad Dhahirah", "Al Wusta",
    ],
    cityLabel: "City / Area",
    cityExample: "e.g. Al Ghubrah",
    postalLabel: "Postal code (optional)",
    // Oman uses post boxes; street delivery relies on area + phone.
    phoneRegex: /^\d{8}$/,
    phoneExample: "8-digit number",
  },
  MV: {
    regionLabel: "Atoll / City",
    cityLabel: "Island / City",
    cityExample: "e.g. Malé",
    postalLabel: "Postal code (optional)",
    postalRegex: /^\d{5}$/,
    postalNumeric: true,
    postalMax: 5,
    phoneRegex: /^\d{7,10}$/,
    phoneExample: "e.g. 300-1234",
  },
};

/** Fallback for any country without a specific structure yet. */
const GENERIC: Territory = {
  regionLabel: "State / Province",
  cityLabel: "City",
  postalLabel: "Postal code",
  postalRegex: POSTAL_CODE_RE,
  postalMax: 10,
  phoneRegex: GENERIC_PHONE,
  phoneExample: "Contact number",
};

/** Address structure for a destination country (falls back to a generic one). */
export const getTerritory = (code?: string): Territory =>
  TERRITORIES[code ?? "IN"] ?? GENERIC;

export const hasRegionList = (code?: string): boolean =>
  Boolean(getTerritory(code).regions);

/** Validate a local phone number for the country (spaces/hyphens allowed). */
export const isValidPhone = (code: string | undefined, value: string): boolean => {
  const digits = value.replace(/[+\s()-]/g, "");
  return getTerritory(code).phoneRegex.test(digits);
};

/** Validate a postal code for the country (empty is valid when optional). */
export const isValidPostal = (code: string | undefined, value: string): boolean => {
  const territory = getTerritory(code);
  const trimmed = value.trim();
  if (!territory.postalRegex) return true;
  return territory.postalRegex.test(trimmed);
};
