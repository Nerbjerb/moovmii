// MTA GTFS Stop ID Mapping
// Maps station names to their GTFS stop IDs and serving lines

export type StopMetadata = {
  name: string;
  stopId: string; // Base stop ID (without N/S suffix)
  lines: string[]; // Lines that serve this stop
};

// Feed URLs for different line groups
export const feedUrls: Record<string, string> = {
  "ACE": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace",
  "BDFM": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-bdfm",
  "G": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g",
  "JZ": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-jz",
  "L": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-l",
  "NQRW": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw",
  "1234567": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs",
  // Staten Island Railway
  "SIR": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-si",
  // Commuter Rail feeds
  "LIRR": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/lirr%2Fgtfs-lirr",
  "MNR": "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr",
};

// Map lines to their feed groups
export const lineToFeedGroup: Record<string, string> = {
  "A": "ACE",
  "C": "ACE",
  "E": "ACE",
  "B": "BDFM",
  "D": "BDFM",
  "F": "BDFM",
  "M": "BDFM",
  "G": "G",
  "J": "JZ",
  "Z": "JZ",
  "L": "L",
  "N": "NQRW",
  "Q": "NQRW",
  "R": "NQRW",
  "W": "NQRW",
  "1": "1234567",
  "2": "1234567",
  "3": "1234567",
  "4": "1234567",
  "5": "1234567",
  "6": "1234567",
  "7": "1234567",
  // Staten Island Railway
  "SIR": "SIR",
  // LIRR Branches (route_id from GTFS)
  "LIRR-1": "LIRR",  // Babylon Branch
  "LIRR-2": "LIRR",  // Hempstead Branch
  "LIRR-3": "LIRR",  // Oyster Bay Branch
  "LIRR-4": "LIRR",  // Ronkonkoma Branch
  "LIRR-5": "LIRR",  // Montauk Branch
  "LIRR-6": "LIRR",  // Long Beach Branch
  "LIRR-7": "LIRR",  // Far Rockaway Branch
  "LIRR-8": "LIRR",  // West Hempstead Branch
  "LIRR-9": "LIRR",  // Port Washington Branch
  "LIRR-10": "LIRR", // Port Jefferson Branch
  // Metro-North Lines (route_id from GTFS)
  "MNR-1": "MNR",    // Hudson Line
  "MNR-2": "MNR",    // Harlem Line
  "MNR-3": "MNR",    // New Haven Line
  "MNR-4": "MNR",    // New Canaan Branch
  "MNR-5": "MNR",    // Danbury Branch
  "MNR-6": "MNR",    // Waterbury Branch
};

// Color groups for same-color line merging
export const colorGroups: Record<string, string[]> = {
  "#EE352E": ["1", "2", "3"],           // Red
  "#00933C": ["4", "5", "6"],           // Green
  "#B933AD": ["7"],                      // Purple
  "#0039A6": ["A", "C", "E"],           // Blue
  "#FF6319": ["B", "D", "F", "M"],      // Orange
  "#FCCC0A": ["N", "Q", "R", "W"],      // Yellow
  "#A7A9AC": ["L"],                      // Gray
  "#6CBE45": ["G"],                      // Light Green
  "#996633": ["J", "Z"],                 // Brown
  "#1D6EB5": ["SIR"],                    // Staten Island Railway (Blue)
  // LIRR Branches - each is its own group (no merging)
  "#00985F-LIRR": ["LIRR-1"],           // Babylon (green)
  "#CE8E00-LIRR": ["LIRR-2"],           // Hempstead (orange)
  "#00AF3F-LIRR": ["LIRR-3"],           // Oyster Bay (green)
  "#A626AA-LIRR": ["LIRR-4"],           // Ronkonkoma (purple)
  "#00B2A9-LIRR": ["LIRR-5"],           // Montauk (teal)
  "#FF6319-LIRR": ["LIRR-6"],           // Long Beach (orange)
  "#6E3219-LIRR": ["LIRR-7"],           // Far Rockaway (brown)
  "#00A1DE-LIRR": ["LIRR-8"],           // West Hempstead (blue)
  "#C60C30-LIRR": ["LIRR-9"],           // Port Washington (red)
  "#006EC7-LIRR": ["LIRR-10"],          // Port Jefferson (blue)
  // Metro-North Lines - each is its own group (no merging)
  "#009B3A-MNR": ["MNR-1"],             // Hudson (green)
  "#0039A6-MNR": ["MNR-2"],             // Harlem (blue)
  "#EE0034-MNR": ["MNR-3", "MNR-4", "MNR-5", "MNR-6"], // New Haven family (red)
};

// Reverse mapping: line to color
export const lineToColor: Record<string, string> = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  "A": "#0039A6", "C": "#0039A6", "E": "#0039A6",
  "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319",
  "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A", "W": "#FCCC0A",
  "L": "#A7A9AC",
  "G": "#6CBE45",
  "J": "#996633", "Z": "#996633",
  "SIR": "#1D6EB5",  // Staten Island Railway
  // LIRR Branches
  "LIRR-1": "#00985F-LIRR",   // Babylon
  "LIRR-2": "#CE8E00-LIRR",   // Hempstead
  "LIRR-3": "#00AF3F-LIRR",   // Oyster Bay
  "LIRR-4": "#A626AA-LIRR",   // Ronkonkoma
  "LIRR-5": "#00B2A9-LIRR",   // Montauk
  "LIRR-6": "#FF6319-LIRR",   // Long Beach
  "LIRR-7": "#6E3219-LIRR",   // Far Rockaway
  "LIRR-8": "#00A1DE-LIRR",   // West Hempstead
  "LIRR-9": "#C60C30-LIRR",   // Port Washington
  "LIRR-10": "#006EC7-LIRR",  // Port Jefferson
  // Metro-North Lines
  "MNR-1": "#009B3A-MNR",     // Hudson
  "MNR-2": "#0039A6-MNR",     // Harlem
  "MNR-3": "#EE0034-MNR",     // New Haven
  "MNR-4": "#EE0034-MNR",     // New Canaan
  "MNR-5": "#EE0034-MNR",     // Danbury
  "MNR-6": "#EE0034-MNR",     // Waterbury
};

// Get all lines that share the same color as a given line
export function getSameColorLines(lineId: string): string[] {
  const color = lineToColor[lineId];
  if (!color) return [lineId];
  return colorGroups[color] || [lineId];
}

// Get feed URLs needed for a set of lines
export function getFeedUrlsForLines(lines: string[]): string[] {
  const feedGroups = new Set<string>();
  for (const line of lines) {
    const group = lineToFeedGroup[line];
    if (group) {
      feedGroups.add(group);
    }
  }
  return Array.from(feedGroups).map(group => feedUrls[group]).filter(Boolean);
}

// Stop ID mappings - maps station names to their GTFS stop IDs
// Format: stopId without direction suffix (add N or S for northbound/southbound)
export const stopIdMap: Record<string, Record<string, string>> = {
  // NQRW Lines (Astoria/Broadway)
  "N": {
    "Astoria-Ditmars Blvd": "R01",
    "Astoria Blvd": "R03",
    "30 Av": "R04",
    "Broadway": "R05",
    "36 Av": "R06",
    "39 Av-Dutch Kills": "R08",
    "Queensboro Plaza": "R09",
    "Lexington Av/59 St": "R11",
    "5 Av/59 St": "R13",
    "57 St-7 Av": "R14",
    "49 St": "R15",
    "Times Sq-42 St": "R16",
    "34 St-Herald Sq": "R17",
    "28 St": "R18",
    "23 St": "R19",
    "14 St-Union Sq": "R20",
    "8 St-NYU": "R21",
    "Prince St": "R22",
    "Canal St": "R23",
    "City Hall": "R24",
    "Cortlandt St": "R25",
    "Rector St": "R26",
    "Whitehall St-South Ferry": "R27",
    "Court St": "R28",
    "Jay St-MetroTech": "R29",
    "DeKalb Av": "R30",
    "Atlantic Av-Barclays Ctr": "R31",
    "36 St": "R36",
    "59 St": "R39",
    "8 Av": "R41",
    "Fort Hamilton Pkwy": "R42",
    "New Utrecht Av": "R43",
    "18 Av": "R44",
    "20 Av": "R45",
    "Bay Pkwy": "R46",
    "Kings Hwy": "R47",
    "Avenue U": "R48",
    "86 St": "R49",
    "Coney Island-Stillwell Av": "R50",
  },
  // ACE Lines - using same mapping where stations overlap
  "A": {
    "Inwood-207 St": "A02",
    "Dyckman St": "A03",
    "190 St": "A04",
    "181 St": "A05",
    "175 St": "A06",
    "168 St": "A07",
    "163 St-Amsterdam Av": "A09",
    "155 St": "A10",
    "145 St": "A11",
    "125 St": "A12",
    "59 St-Columbus Circle": "A24",
    "42 St-Port Authority": "A27",
    "34 St-Penn Station": "A28",
    "14 St": "A31",
    "W 4 St-Wash Sq": "A32",
    "Spring St": "A33",
    "Canal St": "A34",
    "Chambers St": "A36",
    "Fulton St": "A38",
    "High St": "A40",
    "Jay St-MetroTech": "A41",
    "Hoyt-Schermerhorn Sts": "A42",
    "Lafayette Av": "A43",
    "Clinton-Washington Avs": "A44",
    "Franklin Av": "A45",
    "Nostrand Av": "A46",
    "Kingston-Throop Avs": "A47",
    "Utica Av": "A48",
    "Ralph Av": "A49",
    "Rockaway Av": "A50",
    "Broadway Junction": "A51",
    "Liberty Av": "A52",
    "Van Siclen Av": "A53",
    "Shepherd Av": "A54",
    "Euclid Av": "A55",
    "Grant Av": "A57",
    "80 St": "A58",
    "88 St": "A59",
    "Rockaway Blvd": "A60",
    "104 St": "A61",
    "111 St": "A62",
    "Ozone Park-Lefferts Blvd": "A64",
    "Cathedral Pkwy (110 St)": "A17",
    "Howard Beach-JFK Airport": "H03",
    "Broad Channel": "H04",
    "Beach 90 St": "H12",
    "Beach 98 St": "H13",
    "Beach 105 St": "H14",
    "Rockaway Park-Beach 116 St": "H15",
    "Beach 67 St": "H06",
    "Beach 60 St": "H07",
    "Beach 44 St": "H08",
    "Beach 36 St": "H09",
    "Beach 25 St": "H10",
    "Far Rockaway-Mott Av": "H11",
    "Aqueduct Racetrack": "H01",
    "Aqueduct-N Conduit Av": "H02",
  },
  // 123 Lines
  "1": {
    "Van Cortlandt Park-242 St": "101",
    "238 St": "103",
    "231 St": "104",
    "Marble Hill-225 St": "106",
    "215 St": "107",
    "207 St": "108",
    "Dyckman St": "109",
    "191 St": "110",
    "181 St": "111",
    "168 St": "112",
    "157 St": "113",
    "145 St": "114",
    "137 St-City College": "115",
    "125 St": "116",
    "116 St-Columbia University": "117",
    "Cathedral Pkwy-110 St": "118",
    "103 St": "119",
    "96 St": "120",
    "86 St": "121",
    "79 St": "122",
    "72 St": "123",
    "66 St-Lincoln Center": "124",
    "59 St-Columbus Circle": "125",
    "50 St": "126",
    "Times Sq-42 St": "127",
    "34 St-Penn Station": "128",
    "28 St": "129",
    "23 St": "130",
    "18 St": "131",
    "14 St": "132",
    "Christopher St-Sheridan Sq": "133",
    "Houston St": "134",
    "Canal St": "135",
    "Franklin St": "136",
    "Chambers St": "137",
    "Cortlandt St": "138",
    "Rector St": "139",
    "South Ferry": "142",
  },
  // 456 Lines
  "4": {
    "Woodlawn": "401",
    "Mosholu Pkwy": "402",
    "Bedford Park Blvd-Lehman College": "403",
    "Kingsbridge Rd": "404",
    "Fordham Rd": "405",
    "183 St": "406",
    "Burnside Av": "407",
    "176 St": "408",
    "Mt Eden Av": "409",
    "170 St": "410",
    "167 St": "411",
    "161 St-Yankee Stadium": "412",
    "149 St-Grand Concourse": "414",
    "138 St-Grand Concourse": "415",
    "125 St": "416",
    "86 St": "621",
    "59 St": "622",
    "Grand Central-42 St": "631",
    "14 St-Union Sq": "635",
    "Brooklyn Bridge-City Hall": "640",
    "Fulton St": "418",
    "Wall St": "419",
    "Bowling Green": "420",
    "Borough Hall": "423",
    "Nevins St": "424",
    "Atlantic Av-Barclays Ctr": "425",
    "Franklin Av": "429",
    "Crown Hts-Utica Av": "435",
  },
  // 7 Line
  "7": {
    "Flushing-Main St": "701",
    "Mets-Willets Point": "702",
    "111 St": "705",
    "103 St-Corona Plaza": "706",
    "Junction Blvd": "707",
    "90 St-Elmhurst Av": "708",
    "82 St-Jackson Hts": "709",
    "74 St-Broadway": "710",
    "69 St": "711",
    "Woodside-61 St": "712",
    "52 St": "713",
    "46 St-Bliss St": "714",
    "40 St-Lowery St": "715",
    "33 St-Rawson St": "716",
    "Queensboro Plaza": "718",
    "Court Sq": "719",
    "Hunters Point Av": "720",
    "Vernon Blvd-Jackson Av": "721",
    "Grand Central-42 St": "723",
    "Times Sq-42 St": "724",
    "34 St-Hudson Yards": "725",
  },
  // L Line
  "L": {
    "8 Av": "L01",
    "6 Av": "L02",
    "14 St-Union Sq": "L03",
    "3 Av": "L05",
    "1 Av": "L06",
    "Bedford Av": "L08",
    "Lorimer St": "L10",
    "Graham Av": "L11",
    "Grand St": "L12",
    "Montrose Av": "L13",
    "Morgan Av": "L14",
    "Jefferson St": "L15",
    "DeKalb Av": "L16",
    "Myrtle-Wyckoff Avs": "L17",
    "Halsey St": "L19",
    "Wilson Av": "L20",
    "Bushwick Av-Aberdeen St": "L21",
    "Broadway Junction": "L22",
    "Atlantic Av": "L24",
    "Sutter Av": "L25",
    "Livonia Av": "L26",
    "New Lots Av": "L27",
    "East 105 St": "L28",
    "Canarsie-Rockaway Pkwy": "L29",
  },
  // G Line
  "G": {
    "Court Sq": "G22",
    "21 St": "G24",
    "Greenpoint Av": "G26",
    "Nassau Av": "G28",
    "Metropolitan Av": "G29",
    "Broadway": "G30",
    "Flushing Av": "G31",
    "Myrtle-Willoughby Avs": "G32",
    "Bedford-Nostrand Avs": "G33",
    "Classon Av": "G34",
    "Clinton-Washington Avs": "G35",
    "Fulton St": "G36",
    "Hoyt-Schermerhorn Sts": "A42",
    "Bergen St": "F20",
    "Carroll St": "F21",
    "Smith-9 Sts": "F22",
    "4 Av-9 St": "F23",
    "7 Av": "F24",
    "15 St-Prospect Park": "F25",
    "Fort Hamilton Pkwy": "F26",
    "Church Av": "F27",
  },
  // BDFM Lines
  "B": {
    "145 St": "D13",
    "135 St": "D14",
    "125 St": "D15",
    "116 St": "B18",
    "Cathedral Pkwy-110 St": "B19",
    "103 St": "B20",
    "96 St": "B21",
    "86 St": "B22",
    "81 St-Museum of Natural History": "B23",
    "72 St": "B24",
    "59 St-Columbus Circle": "A24",
    "7 Av": "D17",
    "47-50 Sts-Rockefeller Ctr": "D18",
    "42 St-Bryant Park": "D19",
    "34 St-Herald Sq": "D20",
    "W 4 St-Wash Sq": "A32",
    "Broadway-Lafayette St": "D21",
    "Grand St": "D22",
    "DeKalb Av": "R30",
    "Atlantic Av-Barclays Ctr": "R31",
    "Church Av": "D40",
    "Beverley Rd": "D42",
    "Cortelyou Rd": "D43",
    "Newkirk Plaza": "D37",
    "Avenue H": "D35",
    "Avenue J": "D34",
    "Avenue M": "D33",
    "Kings Hwy": "D31",
    "Avenue U": "D30",
    "Neck Rd": "D29",
    "Sheepshead Bay": "D28",
    "Brighton Beach": "D27",
  },
  "D": {
    "Norwood-205 St": "D01",
    "Bedford Park Blvd": "D03",
    "Kingsbridge Rd": "D04",
    "Fordham Rd": "D05",
    "182-183 Sts": "D06",
    "Tremont Av": "D07",
    "174-175 Sts": "D08",
    "170 St": "D09",
    "167 St": "D10",
    "161 St-Yankee Stadium": "D11",
    "155 St": "D12",
    "145 St": "D13",
    "125 St": "D15",
    "59 St-Columbus Circle": "A24",
    "7 Av": "D17",
    "47-50 Sts-Rockefeller Ctr": "D18",
    "42 St-Bryant Pk": "D16",
    "42 St-Bryant Park": "D19",
    "34 St-Herald Sq": "D20",
    "W 4 St-Wash Sq": "A32",
    "Broadway-Lafayette St": "D21",
    "Grand St": "D22",
    "DeKalb Av": "R30",
    "Atlantic Av-Barclays Ctr": "R31",
    "36 St": "R36",
    "9 Av": "D39",
    "Fort Hamilton Pkwy": "D38",
    "50 St": "D41",
    "55 St": "D42",
    "62 St": "D43",
    "71 St": "D44",
    "79 St": "D45",
    "18 Av": "D46",
    "20 Av": "D47",
    "Bay Pkwy": "D48",
    "25 Av": "D49",
    "Bay 50 St": "D50",
    "Coney Island-Stillwell Av": "D43",
  },
  // JZ Lines
  "J": {
    "Jamaica Center-Parsons/Archer": "G05",
    "Sutphin Blvd-Archer Av-JFK": "G06",
    "Jamaica-Van Wyck": "J12",
    "121 St": "J13",
    "111 St": "J14",
    "104 St": "J15",
    "Woodhaven Blvd": "J16",
    "85 St-Forest Pkwy": "J17",
    "75 St-Elderts Ln": "J19",
    "Cypress Hills": "J20",
    "Crescent St": "J21",
    "Cleveland St": "J22",
    "Norwood Av": "J23",
    "Van Siclen Av": "J24",
    "Alabama Av": "J27",
    "Broadway Junction": "J28",
    "Chauncey St": "J29",
    "Halsey St": "J30",
    "Gates Av": "J31",
    "Kosciuszko St": "M11",
    "Myrtle Av": "M12",
    "Flushing Av": "M13",
    "Lorimer St": "M14",
    "Hewes St": "M16",
    "Marcy Av": "M18",
    "Essex St": "M19",
    "Bowery": "J21",
    "Canal St": "J22",
    "Chambers St": "J27",
    "Fulton St": "J28",
    "Broad St": "J29",
  },
};

// Helper to get stop ID for a station on a specific line
export function getStopId(stationName: string, line: string): string | null {
  // First try the specific line's mapping
  if (stopIdMap[line] && stopIdMap[line][stationName]) {
    return stopIdMap[line][stationName];
  }
  
  // For same-color lines, try to find in any of the group
  const sameColorLines = getSameColorLines(line);
  for (const l of sameColorLines) {
    if (stopIdMap[l] && stopIdMap[l][stationName]) {
      return stopIdMap[l][stationName];
    }
  }
  
  // Fall back to searching all lines
  for (const [l, stops] of Object.entries(stopIdMap)) {
    if (stops[stationName]) {
      return stops[stationName];
    }
  }
  
  return null;
}

// Copy stop mappings for same-color lines that share stations
// W shares all N stops
stopIdMap["W"] = { ...stopIdMap["N"] };
// Q shares many stops with N
stopIdMap["Q"] = {
  "96 St": "Q03",
  "86 St": "Q04",
  "72 St": "Q05",
  "Lexington Av/63 St": "B08",
  "57 St-7 Av": "R14",
  "49 St": "R15",
  "Times Sq-42 St": "R16",
  "34 St-Herald Sq": "R17",
  "14 St-Union Sq": "R20",
  "Canal St": "R23",
  "DeKalb Av": "R30",
  "Atlantic Av-Barclays Ctr": "R31",
  "7 Av": "D17",
  "Prospect Park": "D26",
  "Parkside Av": "D25",
  "Church Av": "D40",
  "Beverley Rd": "D42",
  "Cortelyou Rd": "D43",
  "Newkirk Plaza": "D37",
  "Avenue H": "D35",
  "Avenue J": "D34",
  "Avenue M": "D33",
  "Kings Hwy": "D31",
  "Avenue U": "D30",
  "Neck Rd": "D29",
  "Sheepshead Bay": "D28",
  "Brighton Beach": "D27",
  "Ocean Pkwy": "D26",
  "West 8 St-NY Aquarium": "D25",
  "Coney Island-Stillwell Av": "D43",
};
// C shares many stops with A
stopIdMap["C"] = { ...stopIdMap["A"] };
// E has its own stops but shares some with A/C
stopIdMap["E"] = {
  "Jamaica Center-Parsons/Archer": "G05",
  "Sutphin Blvd-Archer Av-JFK": "G06",
  "Jamaica-Van Wyck": "G07",
  "Briarwood": "G08",
  "Kew Gardens-Union Tpke": "G09",
  "75 Av": "G10",
  "Forest Hills-71 Av": "G11",
  "67 Av": "G12",
  "63 Dr-Rego Park": "G13",
  "Woodhaven Blvd": "G14",
  "Grand Av-Newtown": "G15",
  "Elmhurst Av": "G16",
  "Jackson Hts-Roosevelt Av": "G18",
  "Queens Plaza": "G19",
  "Court Sq-23 St": "G20",
  "Lexington Av/53 St": "B10",
  "5 Av/53 St": "B11",
  "7 Av": "D17",
  "50 St": "A26",
  "42 St-Port Authority": "A27",
  "34 St-Penn Station": "A28",
  "23 St": "A30",
  "14 St": "A31",
  "W 4 St-Wash Sq": "A32",
  "Spring St": "A33",
  "Canal St": "A34",
  "World Trade Center": "E01",
};
// 2/3 share many stops with 1
stopIdMap["2"] = {
  "Wakefield-241 St": "201",
  "Nereid Av": "204",
  "233 St": "205",
  "225 St": "206",
  "219 St": "207",
  "Gun Hill Rd": "208",
  "Burke Av": "209",
  "Allerton Av": "210",
  "Pelham Pkwy": "211",
  "Bronx Park East": "212",
  "E 180 St": "213",
  "West Farms Sq-E Tremont Av": "214",
  "174 St": "215",
  "Freeman St": "216",
  "Simpson St": "217",
  "Intervale Av": "218",
  "Prospect Av": "219",
  "Jackson Av": "220",
  "3 Av-149 St": "221",
  "149 St-Grand Concourse": "222",
  "135 St": "224",
  "125 St": "225",
  "116 St": "226",
  "Central Park North-110 St": "227",
  "96 St": "120",
  "72 St": "123",
  "Times Sq-42 St": "127",
  "34 St-Penn Station": "128",
  "14 St": "132",
  "Chambers St": "137",
  "Park Place": "229",
  "Fulton St": "230",
  "Wall St": "231",
  "Clark St": "235",
  "Borough Hall": "234",
  "Hoyt St": "236",
  "Nevins St": "237",
  "Atlantic Av-Barclays Ctr": "238",
  "Bergen St": "239",
  "Grand Army Plaza": "240",
  "Eastern Pkwy-Brooklyn Museum": "241",
  "Franklin Av": "242",
  "President St": "244",
  "Sterling St": "245",
  "Winthrop St": "246",
  "Church Av": "247",
  "Beverly Rd": "248",
  "Newkirk Av": "249",
  "Flatbush Av-Brooklyn College": "250",
  "23 St-Baruch College": "634",
};
stopIdMap["3"] = {
  "Harlem-148 St": "301",
  "145 St": "302",
  "135 St": "224",
  "125 St": "225",
  "116 St": "226",
  "Central Park North-110 St": "227",
  "96 St": "120",
  "72 St": "123",
  "Times Sq-42 St": "127",
  "34 St-Penn Station": "128",
  "14 St": "132",
  "Chambers St": "137",
  "Park Place": "229",
  "Fulton St": "230",
  "Wall St": "231",
  "Clark St": "235",
  "Borough Hall": "234",
  "Hoyt St": "236",
  "Nevins St": "237",
  "Atlantic Av-Barclays Ctr": "238",
  "Bergen St": "239",
  "Grand Army Plaza": "240",
  "Eastern Pkwy-Brooklyn Museum": "241",
  "Franklin Av": "242",
  "Nostrand Av": "248",
  "Kingston Av": "249",
  "Crown Hts-Utica Av": "250",
  "Sutter Av-Rutland Rd": "251",
  "Saratoga Av": "252",
  "Rockaway Av": "253",
  "Junius St": "254",
  "Pennsylvania Av": "255",
  "Van Siclen Av": "256",
  "New Lots Av": "257",
};
// 5 train - Dyre Av / E 180 St to Flatbush Av
stopIdMap["5"] = {
  // Dyre Ave line
  "Eastchester-Dyre Av": "501",
  "Baychester Av": "502",
  "Gun Hill Rd": "503",
  "Pelham Pkwy": "504",
  "Morris Park": "505",
  // Shared with 2 train via E 180 St
  "E 180 St": "213",
  "West Farms Sq-E Tremont Av": "214",
  "174 St": "215",
  "Freeman St": "216",
  "Simpson St": "217",
  "Intervale Av": "218",
  "Prospect Av": "219",
  "Jackson Av": "220",
  "3 Av-149 St": "221",
  "149 St-Grand Concourse": "222",
  "138 St-Grand Concourse": "415",
  "125 St": "416",
  "86 St": "621",
  "59 St": "622",
  "Grand Central-42 St": "631",
  "14 St-Union Sq": "635",
  "Brooklyn Bridge-City Hall": "640",
  "Fulton St": "418",
  "Wall St": "419",
  "Bowling Green": "420",
  "Borough Hall": "423",
  "Nevins St": "424",
  "Atlantic Av-Barclays Ctr": "425",
  "Franklin Av": "429",
  // Nostrand Av branch (flatbush)
  "President St": "244",
  "Sterling St": "245",
  "Winthrop St": "246",
  "Church Av": "247",
  "Beverly Rd": "248",
  "Newkirk Av": "249",
  "Flatbush Av-Brooklyn College": "250",
};
stopIdMap["6"] = {
  "Pelham Bay Park": "601",
  "Buhre Av": "602",
  "Middletown Rd": "603",
  "Westchester Sq-E Tremont Av": "604",
  "Zerega Av": "605",
  "Castle Hill Av": "606",
  "Parkchester": "607",
  "St Lawrence Av": "608",
  "Morrison Av-Soundview": "609",
  "Elder Av": "610",
  "Whitlock Av": "611",
  "Hunts Point Av": "612",
  "Longwood Av": "613",
  "E 149 St": "614",
  "E 143 St-St Mary's St": "615",
  "Cypress Av": "616",
  "Brook Av": "617",
  "3 Av-138 St": "618",
  "125 St": "619",
  "116 St": "620",
  "110 St": "621",
  "103 St": "622",
  "96 St": "623",
  "86 St": "624",
  "77 St": "625",
  "68 St-Hunter College": "626",
  "59 St": "627",
  "51 St": "628",
  "Grand Central-42 St": "631",
  "33 St": "629",
  "28 St": "630",
  "23 St": "632",
  "14 St-Union Sq": "635",
  "Astor Place": "636",
  "Bleecker St": "637",
  "Spring St": "638",
  "Canal St": "639",
  "Brooklyn Bridge-City Hall": "640",
};
// F shares many stops with B/D/M
stopIdMap["F"] = {
  "Jamaica-179 St": "F01",
  "169 St": "F02",
  "Parsons Blvd": "F03",
  "Sutphin Blvd": "F04",
  "Briarwood": "G08",
  "Kew Gardens-Union Tpke": "G09",
  "75 Av": "G10",
  "Forest Hills-71 Av": "G11",
  "67 Av": "G12",
  "63 Dr-Rego Park": "G13",
  "Woodhaven Blvd": "G14",
  "Grand Av-Newtown": "G15",
  "Elmhurst Av": "G16",
  "Jackson Hts-Roosevelt Av": "G18",
  "Queens Plaza": "G19",
  "21 St-Queensbridge": "F05",
  "Roosevelt Island": "F06",
  "Lexington Av/63 St": "B08",
  "57 St": "B09",
  "47-50 Sts-Rockefeller Ctr": "D18",
  "42 St-Bryant Park": "D19",
  "34 St-Herald Sq": "D20",
  "23 St": "F11",
  "14 St": "F12",
  "W 4 St-Wash Sq": "A32",
  "Broadway-Lafayette St": "D21",
  "2 Av": "F14",
  "Delancey St-Essex St": "F15",
  "East Broadway": "F16",
  "York St": "F18",
  "Jay St-MetroTech": "A41",
  "Bergen St": "F20",
  "Carroll St": "F21",
  "Smith-9 Sts": "F22",
  "4 Av-9 St": "F23",
  "7 Av": "F24",
  "15 St-Prospect Park": "F25",
  "Fort Hamilton Pkwy": "F26",
  "Church Av": "F27",
  "Ditmas Av": "F29",
  "18 Av": "F30",
  "Avenue I": "F31",
  "Bay Pkwy": "F32",
  "Avenue N": "F33",
  "Avenue P": "F34",
  "Kings Hwy": "F35",
  "Avenue U": "F36",
  "Avenue X": "F38",
  "Neptune Av": "F39",
  "Coney Island-Stillwell Av": "D43",
};
// M shares many stops with F, plus Queens Blvd local stations
stopIdMap["M"] = { 
  ...stopIdMap["F"],
  // Queens Boulevard local stations (M/R only)
  "65 St": "G22",
  "Northern Blvd": "G21",
  "46 St": "G20",
  "Steinway St": "G19",
  // M train Ridgewood/Middle Village stations
  "Middle Village-Metropolitan Av": "M01",
  "Fresh Pond Rd": "M04",
  "Forest Av": "M05",
  "Seneca Av": "M06",
  "Myrtle-Wyckoff Avs": "M08",
  "Knickerbocker Av": "M09",
  "Central Av": "M10",
  "Myrtle Av": "M11",
};
// Z shares all stops with J
stopIdMap["Z"] = { ...stopIdMap["J"] };

// Add Queens Boulevard local stations to R line
stopIdMap["R"] = {
  ...stopIdMap["N"],
  // Queens Boulevard local stations (M/R only)
  "65 St": "G22",
  "Northern Blvd": "G21",
  "46 St": "G20",
  "Steinway St": "G19",
  // Missing R train Brooklyn stations
  "25 St": "R35",
  "Union St": "R32",
  "53 St": "R40",
};

// LIRR Stations - using GTFS stop_id values
// Note: LIRR doesn't use N/S suffixes - stop IDs are used directly
stopIdMap["LIRR-1"] = { // Babylon Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Mineola": "132",
  "Babylon": "10",
  "Bay Shore": "12",
  "Islip": "100",
  "Lindenhurst": "117",
  "Copiague": "38",
  "Amityville": "8",
  "Massapequa": "136",
  "Massapequa Park": "135",
  "Seaford": "175",
  "Wantagh": "195",
  "Bellmore": "16",
  "Merrick": "134",
  "Freeport": "64",
  "Baldwin": "9",
  "Rockville Centre": "167",
  "Lynbrook": "125",
  "St Albans": "179",
  "Valley Stream": "191",
};
stopIdMap["LIRR-2"] = { // Hempstead Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Hempstead": "84",
  "Garden City": "68",
  "Country Life Press": "37",
  "Nassau Boulevard": "149",
  "Stewart Manor": "181",
  "Floral Park": "63",
  "Queens Village": "165",
  "Hollis": "89",
};
stopIdMap["LIRR-3"] = { // Oyster Bay Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Oyster Bay": "154",
  "Locust Valley": "123",
  "Glen Cove": "67",
  "Glen Head": "71",
  "Sea Cliff": "173",
  "Glen Street": "76",
  "Greenvale": "77",
  "Roslyn": "168",
  "Albertson": "1",
  "East Williston": "52",
  "Mineola": "132",
};
stopIdMap["LIRR-4"] = { // Ronkonkoma Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Ronkonkoma": "166",
  "Central Islip": "28",
  "Brentwood": "20",
  "Deer Park": "44",
  "Wyandanch": "201",
  "Pinelawn": "161",
  "Farmingdale": "59",
  "Bethpage": "17",
  "Hicksville": "92",
  "Westbury": "196",
  "Carle Place": "39",
  "Mineola": "132",
  "New Hyde Park": "152",
  "Floral Park": "63",
  "Woodside": "200",
  "Forest Hills": "55",
  "Kew Gardens": "107",
};
stopIdMap["LIRR-5"] = { // Montauk Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Montauk": "141",
  "Amagansett": "4",
  "East Hampton": "48",
  "Bridgehampton": "13",
  "Southampton": "176",
  "Hampton Bays": "83",
  "Westhampton": "197",
  "Speonk": "177",
  "Bellport": "15",
  "Patchogue": "160",
  "Sayville": "171",
  "Oakdale": "157",
  "Great River": "74",
  "Islip": "100",
  "Bay Shore": "12",
  "Babylon": "10",
};
stopIdMap["LIRR-6"] = { // Long Beach Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Long Beach": "113",
  "Island Park": "99",
  "Oceanside": "155",
  "East Rockaway": "51",
  "Centre Avenue": "27",
  "Lynbrook": "125",
  "Valley Stream": "191",
};
stopIdMap["LIRR-7"] = { // Far Rockaway Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Far Rockaway": "65",
  "Inwood": "101",
  "Lawrence": "114",
  "Cedarhurst": "25",
  "Woodmere": "199",
  "Hewlett": "94",
  "Gibson": "66",
  "Valley Stream": "191",
  "Locust Manor": "119",
  "St Albans": "179",
};
stopIdMap["LIRR-8"] = { // West Hempstead Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "West Hempstead": "194",
  "Hempstead Gardens": "85",
  "Lakeview": "124",
  "Malverne": "142",
  "Westwood": "198",
  "Valley Stream": "191",
  "St Albans": "179",
};
stopIdMap["LIRR-9"] = { // Port Washington Branch
  "Penn Station": "8",
  "Port Washington": "163",
  "Plandome": "162",
  "Manhasset": "131",
  "Great Neck": "72",
  "Little Neck": "120",
  "Douglaston": "42",
  "Bayside": "11",
  "Auburndale": "7",
  "Broadway": "11",
  "Murray Hill": "130",
  "Flushing Main Street": "56",
  "Woodside": "200",
};
stopIdMap["LIRR-10"] = { // Port Jefferson Branch
  "Penn Station": "8",
  "Jamaica": "102",
  "Port Jefferson": "164",
  "Stony Brook": "14",
  "St James": "178",
  "Smithtown": "174",
  "Kings Park": "111",
  "Northport": "153",
  "Greenlawn": "78",
  "Huntington": "91",
  "Cold Spring Harbor": "40",
  "Syosset": "185",
  "Hicksville": "92",
  "Mineola": "132",
};

// Metro-North Stations - using GTFS stop_id values
stopIdMap["MNR-1"] = { // Hudson Line
  "Grand Central": "1",
  "Harlem-125 St": "4",
  "Yankees-E 153 St": "622",
  "Morris Heights": "9",
  "University Heights": "10",
  "Marble Hill": "11",
  "Spuyten Duyvil": "14",
  "Riverdale": "16",
  "Ludlow": "17",
  "Yonkers": "18",
  "Glenwood": "19",
  "Greystone": "20",
  "Hastings-on-Hudson": "22",
  "Dobbs Ferry": "23",
  "Ardsley-on-Hudson": "24",
  "Irvington": "25",
  "Tarrytown": "27",
  "Philipse Manor": "29",
  "Scarborough": "30",
  "Ossining": "31",
  "Croton-Harmon": "33",
  "Cortlandt": "37",
  "Peekskill": "39",
  "Manitou": "40",
  "Garrison": "42",
  "Cold Spring": "43",
  "Breakneck Ridge": "44",
  "Beacon": "46",
  "New Hamburg": "49",
  "Poughkeepsie": "51",
};
stopIdMap["MNR-2"] = { // Harlem Line
  "Grand Central": "1",
  "Harlem-125 St": "4",
  "Melrose": "54",
  "Tremont": "55",
  "Fordham": "56",
  "Botanical Garden": "57",
  "Williams Bridge": "58",
  "Woodlawn": "59",
  "Wakefield": "61",
  "Mt Vernon West": "62",
  "Fleetwood": "64",
  "Bronxville": "65",
  "Tuckahoe": "66",
  "Crestwood": "68",
  "Scarsdale": "71",
  "Hartsdale": "73",
  "White Plains": "75",
  "North White Plains": "77",
  "Valhalla": "78",
  "Mt Pleasant": "80",
  "Hawthorne": "81",
  "Pleasantville": "82",
  "Chappaqua": "85",
  "Mt Kisco": "86",
  "Bedford Hills": "88",
  "Katonah": "89",
  "Goldens Bridge": "90",
  "Purdy's": "91",
  "Croton Falls": "93",
  "Brewster": "94",
  "Southeast": "96",
  "Patterson": "98",
  "Pawling": "100",
  "Appalachian Trail": "101",
  "Dover Plains": "103",
  "Wassaic": "104",
};
stopIdMap["MNR-3"] = { // New Haven Line
  "Grand Central": "1",
  "Harlem-125 St": "4",
  "Fordham": "56",
  "Mount Vernon East": "105",
  "Pelham": "106",
  "New Rochelle": "108",
  "Larchmont": "110",
  "Mamaroneck": "111",
  "Harrison": "112",
  "Rye": "114",
  "Port Chester": "115",
  "Greenwich": "116",
  "Cos Cob": "118",
  "Riverside": "120",
  "Old Greenwich": "121",
  "Stamford": "124",
  "Noroton Heights": "127",
  "Darien": "128",
  "Rowayton": "129",
  "South Norwalk": "131",
  "East Norwalk": "133",
  "Westport": "134",
  "Green's Farms": "136",
  "Southport": "137",
  "Fairfield": "138",
  "Fairfield-Black Rock": "188",
  "Bridgeport": "140",
  "Stratford": "143",
  "Milford": "145",
  "West Haven": "190",
  "New Haven": "149",
  "New Haven-State St": "151",
};
stopIdMap["MNR-4"] = { // New Canaan Branch
  "Grand Central": "1",
  "Stamford": "124",
  "Glenbrook": "153",
  "Springdale": "154",
  "Talmadge Hill": "155",
  "New Canaan": "157",
};
stopIdMap["MNR-5"] = { // Danbury Branch
  "Grand Central": "1",
  "South Norwalk": "131",
  "Merritt 7": "158",
  "Wilton": "160",
  "Cannondale": "161",
  "Branchville": "162",
  "Redding": "163",
  "Bethel": "164",
  "Danbury": "165",
};
stopIdMap["MNR-6"] = { // Waterbury Branch
  "Grand Central": "1",
  "Bridgeport": "140",
  "Derby-Shelton": "167",
  "Ansonia": "168",
  "Seymour": "169",
  "Beacon Falls": "170",
  "Naugatuck": "171",
  "Waterbury": "172",
};

// Staten Island Railway (SIR) Stations
stopIdMap["SIR"] = {
  "St George": "S31",
  "Tompkinsville": "S30",
  "Stapleton": "S29",
  "Clifton": "S28",
  "Grasmere": "S27",
  "Old Town": "S26",
  "Dongan Hills": "S25",
  "Jefferson Av": "S24",
  "Grant City": "S23",
  "New Dorp": "S22",
  "Oakwood Heights": "S21",
  "Bay Terrace": "S20",
  "Great Kills": "S19",
  "Eltingville": "S18",
  "Annadale": "S17",
  "Huguenot": "S16",
  "Prince's Bay": "S15",
  "Pleasant Plains": "S14",
  "Richmond Valley": "S13",
  "Arthur Kill": "S11",
  "Tottenville": "S09",
  "Park Pl": "S03",
  "Botanic Garden": "S04",
};

// PATH Stations - using Matt Razza API station codes
// Newark - World Trade Center route
stopIdMap["PATH-NWK"] = {
  "Newark": "newark",
  "Harrison": "harrison",
  "Journal Square": "journal_square",
  "Grove Street": "grove_street",
  "Exchange Place": "exchange_place",
  "World Trade Center": "world_trade_center",
};

// Journal Square - 33 Street route
stopIdMap["PATH-JSQ"] = {
  "Journal Square": "journal_square",
  "Grove Street": "grove_street",
  "Newport": "newport",
  "Hoboken": "hoboken",
  "Christopher Street": "christopher_street",
  "9th Street": "ninth_street",
  "14th Street": "fourteenth_street",
  "23rd Street": "twenty_third_street",
  "33rd Street": "thirty_third_street",
};

// Hoboken - World Trade Center route
stopIdMap["PATH-HOB-WTC"] = {
  "Hoboken": "hoboken",
  "Newport": "newport",
  "Exchange Place": "exchange_place",
  "World Trade Center": "world_trade_center",
};

// Hoboken - 33 Street route
stopIdMap["PATH-HOB-33"] = {
  "Hoboken": "hoboken",
  "Christopher Street": "christopher_street",
  "9th Street": "ninth_street",
  "14th Street": "fourteenth_street",
  "23rd Street": "twenty_third_street",
  "33rd Street": "thirty_third_street",
};
