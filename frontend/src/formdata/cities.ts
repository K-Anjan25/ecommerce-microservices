/**
 * Curated major-city lists for the delivery country picker.
 *
 * The city field renders as a dropdown of these entries with an
 * "Other (type manually)" escape hatch, so small towns still work. India is
 * absent on purpose — its district cascade already comes from formdata.json.
 */
export const CITY_OPTIONS: Record<string, string[]> = {
  US: [
    "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
    "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
    "Fort Worth", "Columbus", "Charlotte", "Indianapolis", "San Francisco",
    "Seattle", "Denver", "Nashville", "Oklahoma City", "El Paso", "Boston",
    "Portland", "Las Vegas", "Detroit", "Memphis", "Louisville", "Baltimore",
    "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento", "Kansas City",
    "Atlanta", "Omaha", "Colorado Springs", "Raleigh", "Miami", "Oakland",
    "Minneapolis", "Tulsa", "Wichita", "New Orleans", "Arlington", "Cleveland",
    "Tampa", "Honolulu", "Anchorage",
  ],
  CA: [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton",
    "Mississauga", "Winnipeg", "Hamilton", "Brampton", "Kitchener", "London",
    "Quebec City", "Victoria", "Halifax", "Saskatoon", "Regina",
    "St. John's", "Windsor", "Kelowna",
  ],
  GB: [
    "London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Liverpool",
    "Bristol", "Sheffield", "Edinburgh", "Cardiff", "Belfast",
    "Newcastle upon Tyne", "Nottingham", "Leicester", "Coventry", "Brighton",
    "Oxford", "Cambridge", "York", "Southampton", "Plymouth", "Stoke-on-Trent",
    "Wolverhampton", "Swansea", "Aberdeen", "Dundee", "Norwich", "Bath",
    "Milton Keynes", "Reading", "Portsmouth", "Exeter", "Chester", "Durham",
  ],
  AU: [
    "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast",
    "Canberra", "Newcastle", "Wollongong", "Hobart", "Darwin", "Geelong",
    "Townsville", "Cairns", "Toowoomba", "Ballarat", "Bendigo", "Launceston",
  ],
  NZ: [
    "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Napier",
    "Dunedin", "Palmerston North", "Nelson", "Rotorua", "Whangārei",
    "New Plymouth", "Invercargill", "Queenstown",
  ],
  AE: [
    "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah",
    "Fujairah", "Umm Al Quwain", "Deira", "Jumeirah",
  ],
  SG: ["Singapore"],
  JP: [
    "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe",
    "Kyoto", "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Chiba",
    "Kitakyushu", "Sakai", "Niigata", "Hamamatsu", "Kumamoto", "Okayama",
    "Shizuoka",
  ],
  KR: [
    "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan",
    "Suwon", "Seongnam", "Goyang", "Yongin", "Bucheon", "Cheongju", "Ansan",
    "Anyang", "Jeju City", "Changwon",
  ],
  DE: [
    "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart",
    "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden",
    "Hanover", "Nuremberg", "Duisburg", "Bonn", "Münster", "Karlsruhe",
    "Mannheim", "Augsburg",
  ],
  FR: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier",
    "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon",
    "Saint-Étienne", "Le Havre", "Grenoble", "Dijon", "Angers", "Nîmes",
    "Aix-en-Provence",
  ],
  NL: [
    "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen",
    "Tilburg", "Almere", "Breda", "Nijmegen", "Apeldoorn", "Haarlem",
    "Arnhem", "Enschede", "Maastricht",
  ],
  BE: [
    "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur",
    "Leuven", "Mons", "Aalst", "Mechelen", "La Louvière",
  ],
  ES: [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga",
    "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba",
    "Valladolid", "Vigo", "Gijón", "Granada",
  ],
  SE: [
    "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Linköping", "Örebro",
    "Västerås", "Lund", "Helsingborg", "Umeå", "Jönköping", "Norrköping",
  ],
  CH: [
    "Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Winterthur", "Lucerne",
    "St. Gallen", "Lugano", "Biel/Bienne", "Thun", "Köniz",
    "La Chaux-de-Fonds", "Schaffhausen", "Fribourg", "Zug",
  ],
  ZA: [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Gqeberha",
    "Bloemfontein", "East London", "Pietermaritzburg", "Mbombela",
    "Kimberley", "Polokwane", "Stellenbosch",
  ],
  LK: [
    "Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Kandy", "Negombo",
    "Jaffna", "Galle", "Trincomalee", "Kurunegala", "Anuradhapura",
    "Batticaloa", "Matara",
  ],
  NP: [
    "Kathmandu", "Pokhara", "Lalitpur", "Biratnagar", "Bharatpur", "Birgunj",
    "Janakpur", "Dharan", "Butwal", "Hetauda", "Nepalgunj", "Dhangadhi",
  ],
  TH: [
    "Bangkok", "Chiang Mai", "Phuket City", "Pattaya", "Hat Yai",
    "Nonthaburi", "Udon Thani", "Khon Kaen", "Nakhon Ratchasima",
    "Chiang Rai", "Surat Thani", "Hua Hin",
  ],
  MY: [
    "Kuala Lumpur", "Johor Bahru", "George Town", "Ipoh", "Shah Alam",
    "Petaling Jaya", "Malacca City", "Kota Kinabalu", "Kuching", "Putrajaya",
    "Klang", "Seremban",
  ],
  MU: [
    "Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe",
    "Quatre Bornes", "Mahébourg", "Flacq",
  ],
  BH: ["Manama", "Riffa", "Muharraq", "Hamad Town", "Isa Town", "Sitra", "Budaiya"],
  KW: [
    "Kuwait City", "Al Ahmadi", "Hawalli", "Salmiya", "Jahra", "Fahaheel",
    "Farwaniya", "Mangaf",
  ],
  QA: ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor", "Umm Salal", "Lusail"],
  OM: ["Muscat", "Seeb", "Salalah", "Sohar", "Nizwa", "Sur", "Barka", "Ruwi"],
  MV: ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo", "Hulhumalé"],
};

/** Sentinel for the "Other (type manually)" dropdown entry. */
export const CITY_OTHER = "__OTHER__";
