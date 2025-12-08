import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Home, Square, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react";
import train1Icon from "@assets/moovmii/MTA Icons/src/svg/1.svg";
import train2Icon from "@assets/moovmii/MTA Icons/src/svg/2.svg";
import train3Icon from "@assets/moovmii/MTA Icons/src/svg/3.svg";
import train4Icon from "@assets/moovmii/MTA Icons/src/svg/4.svg";
import train5Icon from "@assets/moovmii/MTA Icons/src/svg/5.svg";
import train6Icon from "@assets/moovmii/MTA Icons/src/svg/6.svg";
import train7Icon from "@assets/moovmii/MTA Icons/src/svg/7.svg";
import trainAIcon from "@assets/moovmii/MTA Icons/src/svg/a.svg";
import trainCIcon from "@assets/moovmii/MTA Icons/src/svg/c.svg";
import trainEIcon from "@assets/moovmii/MTA Icons/src/svg/e.svg";
import trainBIcon from "@assets/moovmii/MTA Icons/src/svg/b.svg";
import trainDIcon from "@assets/moovmii/MTA Icons/src/svg/d.svg";
import trainFIcon from "@assets/moovmii/MTA Icons/src/svg/f.svg";
import trainMIcon from "@assets/moovmii/MTA Icons/src/svg/m.svg";
import trainNIcon from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import trainQIcon from "@assets/moovmii/MTA Icons/src/svg/q.svg";
import trainRIcon from "@assets/moovmii/MTA Icons/src/svg/r.svg";
import trainWIcon from "@assets/moovmii/MTA Icons/src/svg/w.svg";
import trainLIcon from "@assets/moovmii/MTA Icons/src/svg/l.svg";
import trainGIcon from "@assets/moovmii/MTA Icons/src/svg/g.svg";
import trainJIcon from "@assets/moovmii/MTA Icons/src/svg/j.svg";
import trainZIcon from "@assets/moovmii/MTA Icons/src/svg/z.svg";
import sirIcon from "@assets/moovmii/MTA Icons/src/svg/sir.svg";
import pathIcon from "@assets/moovmii/MTA Icons/src/svg/PATH_logo_no_bg.png";
import lirrIcon from "@assets/moovmii/MTA Icons/src/svg/LIRR_logo_white.png";
import metroNorthIcon from "@assets/moovmii/MTA Icons/src/svg/Metro-North_logo_white.png";
import njTransitIcon from "@assets/moovmii/MTA Icons/src/svg/New_Jersey_Transit_white_cropped_trimmed.png";

type LineItem = {
  id: string;
  icon: string;
  alt: string;
  size?: string;
  isRegional?: boolean;
};

type GroupItem = {
  id: string;
  lines: LineItem[];
};

const lineColors: Record<string, string> = {
  "1": "#EE352E",
  "2": "#EE352E",
  "3": "#EE352E",
  "4": "#00933C",
  "5": "#00933C",
  "6": "#00933C",
  "7": "#B933AD",
  "A": "#0039A6",
  "C": "#0039A6",
  "E": "#0039A6",
  "B": "#FF6319",
  "D": "#FF6319",
  "F": "#FF6319",
  "M": "#FF6319",
  "N": "#FCCC0A",
  "Q": "#FCCC0A",
  "R": "#FCCC0A",
  "W": "#FCCC0A",
  "L": "#A7A9AC",
  "G": "#6CBE45",
  "J": "#996633",
  "Z": "#996633",
  "SIR": "#0039A6",
  "LIRR": "#0039A6",
  "MetroNorth": "#0039A6",
  "PATH": "#0039A6",
  "NJT": "#0039A6",
};

const lineStops: Record<string, string[]> = {
  "1": [
    "Van Cortlandt Park-242 St",
    "238 St",
    "231 St",
    "Marble Hill-225 St",
    "215 St",
    "207 St",
    "Dyckman St",
    "191 St",
    "181 St",
    "168 St",
    "157 St",
    "145 St",
    "137 St-City College",
    "125 St",
    "116 St-Columbia University",
    "Cathedral Pkwy-110 St",
    "103 St",
    "96 St",
    "86 St",
    "79 St",
    "72 St",
    "66 St-Lincoln Center",
    "59 St-Columbus Circle",
    "50 St",
    "Times Sq-42 St",
    "34 St-Penn Station",
    "28 St",
    "23 St",
    "18 St",
    "14 St",
    "Christopher St-Sheridan Sq",
    "Houston St",
    "Canal St",
    "Franklin St",
    "Chambers St",
    "Cortlandt St",
    "Rector St",
    "South Ferry"
  ],
  "2": [
    "Wakefield-241 St",
    "Nereid Av",
    "233 St",
    "225 St",
    "219 St",
    "Gun Hill Rd",
    "Burke Av",
    "Allerton Av",
    "Pelham Pkwy",
    "Bronx Park East",
    "E 180 St",
    "West Farms Sq-E Tremont Av",
    "174 St",
    "Freeman St",
    "Simpson St",
    "Intervale Av",
    "Prospect Av",
    "Jackson Av",
    "3 Av-149 St",
    "149 St-Grand Concourse",
    "135 St",
    "125 St",
    "116 St",
    "Central Park North-110 St",
    "96 St",
    "72 St",
    "Times Sq-42 St",
    "34 St-Penn Station",
    "14 St",
    "Chambers St",
    "Park Place",
    "Fulton St",
    "Wall St",
    "Clark St",
    "Borough Hall",
    "Hoyt St",
    "Nevins St",
    "Atlantic Av-Barclays Ctr",
    "Bergen St",
    "Grand Army Plaza",
    "Eastern Pkwy-Brooklyn Museum",
    "Franklin Av",
    "President St",
    "Sterling St",
    "Winthrop St",
    "Church Av",
    "Beverly Rd",
    "Newkirk Av",
    "Flatbush Av-Brooklyn College"
  ],
  "3": [
    "Harlem-148 St",
    "145 St",
    "135 St",
    "125 St",
    "116 St",
    "Central Park North-110 St",
    "96 St",
    "72 St",
    "Times Sq-42 St",
    "34 St-Penn Station",
    "14 St",
    "Chambers St",
    "Park Place",
    "Fulton St",
    "Wall St",
    "Clark St",
    "Borough Hall",
    "Hoyt St",
    "Nevins St",
    "Atlantic Av-Barclays Ctr",
    "Bergen St",
    "Grand Army Plaza",
    "Eastern Pkwy-Brooklyn Museum",
    "Franklin Av",
    "Nostrand Av",
    "Kingston Av",
    "Crown Hts-Utica Av",
    "Sutter Av-Rutland Rd",
    "Saratoga Av",
    "Rockaway Av",
    "Junius St",
    "Pennsylvania Av",
    "Van Siclen Av",
    "New Lots Av"
  ],
  "4": [
    "Woodlawn",
    "Mosholu Pkwy",
    "Bedford Park Blvd-Lehman College",
    "Kingsbridge Rd",
    "Fordham Rd",
    "183 St",
    "Burnside Av",
    "176 St",
    "Mt Eden Av",
    "170 St",
    "167 St",
    "161 St-Yankee Stadium",
    "149 St-Grand Concourse",
    "138 St-Grand Concourse",
    "125 St",
    "86 St",
    "59 St",
    "Grand Central-42 St",
    "14 St-Union Sq",
    "Brooklyn Bridge-City Hall",
    "Fulton St",
    "Wall St",
    "Bowling Green",
    "Borough Hall",
    "Nevins St",
    "Atlantic Av-Barclays Ctr",
    "Franklin Av",
    "Crown Hts-Utica Av"
  ],
  "5": [
    "Eastchester-Dyre Av",
    "Baychester Av",
    "Gun Hill Rd",
    "Pelham Pkwy",
    "Morris Park",
    "E 180 St",
    "West Farms Sq-E Tremont Av",
    "174 St",
    "Freeman St",
    "Simpson St",
    "Intervale Av",
    "Prospect Av",
    "Jackson Av",
    "3 Av-149 St",
    "149 St-Grand Concourse",
    "138 St-Grand Concourse",
    "125 St",
    "86 St",
    "59 St",
    "Grand Central-42 St",
    "14 St-Union Sq",
    "Brooklyn Bridge-City Hall",
    "Fulton St",
    "Wall St",
    "Bowling Green",
    "Borough Hall",
    "Nevins St",
    "Atlantic Av-Barclays Ctr",
    "Franklin Av",
    "President St",
    "Sterling St",
    "Winthrop St",
    "Church Av",
    "Beverly Rd",
    "Newkirk Av",
    "Flatbush Av-Brooklyn College"
  ],
  "6": [
    "Pelham Bay Park",
    "Buhre Av",
    "Middletown Rd",
    "Westchester Sq-E Tremont Av",
    "Zerega Av",
    "Castle Hill Av",
    "Parkchester",
    "St Lawrence Av",
    "Morrison Av-Soundview",
    "Elder Av",
    "Whitlock Av",
    "Hunts Point Av",
    "Longwood Av",
    "E 149 St",
    "E 143 St-St Mary's St",
    "Cypress Av",
    "Brook Av",
    "3 Av-138 St",
    "125 St",
    "116 St",
    "110 St",
    "103 St",
    "96 St",
    "86 St",
    "77 St",
    "68 St-Hunter College",
    "59 St",
    "51 St",
    "Grand Central-42 St",
    "33 St",
    "28 St",
    "23 St",
    "14 St-Union Sq",
    "Astor Place",
    "Bleecker St",
    "Spring St",
    "Canal St",
    "Brooklyn Bridge-City Hall"
  ],
  "7": [
    "Flushing-Main St",
    "Mets-Willets Point",
    "111 St",
    "103 St-Corona Plaza",
    "Junction Blvd",
    "90 St-Elmhurst Av",
    "82 St-Jackson Hts",
    "74 St-Broadway",
    "69 St",
    "Woodside-61 St",
    "52 St",
    "46 St-Bliss St",
    "40 St-Lowery St",
    "33 St-Rawson St",
    "Queensboro Plaza",
    "Court Sq",
    "Hunters Point Av",
    "Vernon Blvd-Jackson Av",
    "Grand Central-42 St",
    "Times Sq-42 St",
    "34 St-Hudson Yards"
  ],
  "A": [
    "Inwood-207 St",
    "Dyckman St",
    "190 St",
    "181 St",
    "175 St",
    "168 St",
    "163 St-Amsterdam Av",
    "155 St",
    "145 St",
    "125 St",
    "59 St-Columbus Circle",
    "42 St-Port Authority",
    "34 St-Penn Station",
    "14 St",
    "W 4 St-Wash Sq",
    "Spring St",
    "Canal St",
    "Chambers St",
    "Fulton St",
    "High St",
    "Jay St-MetroTech",
    "Hoyt-Schermerhorn Sts",
    "Lafayette Av",
    "Clinton-Washington Avs",
    "Franklin Av",
    "Nostrand Av",
    "Kingston-Throop Avs",
    "Utica Av",
    "Ralph Av",
    "Rockaway Av",
    "Broadway Junction",
    "Liberty Av",
    "Van Siclen Av",
    "Shepherd Av",
    "Euclid Av",
    "Grant Av",
    "80 St",
    "88 St",
    "Rockaway Blvd",
    "104 St",
    "111 St",
    "Ozone Park-Lefferts Blvd"
  ],
  "C": [
    "168 St",
    "163 St-Amsterdam Av",
    "155 St",
    "145 St",
    "135 St",
    "125 St",
    "116 St",
    "Cathedral Pkwy-110 St",
    "103 St",
    "96 St",
    "86 St",
    "81 St-Museum of Natural History",
    "72 St",
    "59 St-Columbus Circle",
    "50 St",
    "42 St-Port Authority",
    "34 St-Penn Station",
    "23 St",
    "14 St",
    "W 4 St-Wash Sq",
    "Spring St",
    "Canal St",
    "Chambers St",
    "Fulton St",
    "High St",
    "Jay St-MetroTech",
    "Hoyt-Schermerhorn Sts",
    "Lafayette Av",
    "Clinton-Washington Avs",
    "Franklin Av",
    "Nostrand Av",
    "Kingston-Throop Avs",
    "Utica Av",
    "Ralph Av",
    "Rockaway Av",
    "Broadway Junction",
    "Liberty Av",
    "Van Siclen Av",
    "Shepherd Av",
    "Euclid Av"
  ],
  "E": [
    "Jamaica Center-Parsons/Archer",
    "Sutphin Blvd-Archer Av-JFK",
    "Jamaica-Van Wyck",
    "Briarwood",
    "Kew Gardens-Union Tpke",
    "75 Av",
    "Forest Hills-71 Av",
    "67 Av",
    "63 Dr-Rego Park",
    "Woodhaven Blvd",
    "Grand Av-Newtown",
    "Elmhurst Av",
    "Jackson Hts-Roosevelt Av",
    "Queens Plaza",
    "Court Sq-23 St",
    "Lexington Av/53 St",
    "5 Av/53 St",
    "7 Av",
    "50 St",
    "42 St-Port Authority",
    "34 St-Penn Station",
    "23 St",
    "14 St",
    "W 4 St-Wash Sq",
    "Spring St",
    "Canal St",
    "World Trade Center"
  ],
  "B": [
    "145 St",
    "135 St",
    "125 St",
    "116 St",
    "Cathedral Pkwy-110 St",
    "103 St",
    "96 St",
    "86 St",
    "81 St-Museum of Natural History",
    "72 St",
    "59 St-Columbus Circle",
    "7 Av",
    "47-50 Sts-Rockefeller Ctr",
    "42 St-Bryant Park",
    "34 St-Herald Sq",
    "W 4 St-Wash Sq",
    "Broadway-Lafayette St",
    "Grand St",
    "DeKalb Av",
    "Atlantic Av-Barclays Ctr",
    "7 Av",
    "Church Av",
    "Beverley Rd",
    "Cortelyou Rd",
    "Newkirk Plaza",
    "Avenue H",
    "Avenue J",
    "Avenue M",
    "Kings Hwy",
    "Avenue U",
    "Neck Rd",
    "Sheepshead Bay",
    "Brighton Beach"
  ],
  "D": [
    "Norwood-205 St",
    "Bedford Park Blvd",
    "Kingsbridge Rd",
    "Fordham Rd",
    "182-183 Sts",
    "Tremont Av",
    "174-175 Sts",
    "170 St",
    "167 St",
    "161 St-Yankee Stadium",
    "155 St",
    "145 St",
    "125 St",
    "59 St-Columbus Circle",
    "7 Av",
    "47-50 Sts-Rockefeller Ctr",
    "42 St-Bryant Park",
    "34 St-Herald Sq",
    "W 4 St-Wash Sq",
    "Broadway-Lafayette St",
    "Grand St",
    "DeKalb Av",
    "Atlantic Av-Barclays Ctr",
    "36 St",
    "9 Av",
    "Fort Hamilton Pkwy",
    "50 St",
    "55 St",
    "62 St",
    "71 St",
    "79 St",
    "18 Av",
    "20 Av",
    "Bay Pkwy",
    "25 Av",
    "Bay 50 St",
    "Coney Island-Stillwell Av"
  ],
  "F": [
    "Jamaica-179 St",
    "169 St",
    "Parsons Blvd",
    "Sutphin Blvd",
    "Briarwood",
    "Kew Gardens-Union Tpke",
    "75 Av",
    "Forest Hills-71 Av",
    "67 Av",
    "63 Dr-Rego Park",
    "Woodhaven Blvd",
    "Grand Av-Newtown",
    "Elmhurst Av",
    "Jackson Hts-Roosevelt Av",
    "Queens Plaza",
    "21 St-Queensbridge",
    "Roosevelt Island",
    "Lexington Av/63 St",
    "57 St",
    "47-50 Sts-Rockefeller Ctr",
    "42 St-Bryant Park",
    "34 St-Herald Sq",
    "23 St",
    "14 St",
    "W 4 St-Wash Sq",
    "Broadway-Lafayette St",
    "2 Av",
    "Delancey St-Essex St",
    "East Broadway",
    "York St",
    "Jay St-MetroTech",
    "Bergen St",
    "Carroll St",
    "Smith-9 Sts",
    "4 Av-9 St",
    "7 Av",
    "15 St-Prospect Park",
    "Fort Hamilton Pkwy",
    "Church Av",
    "Ditmas Av",
    "18 Av",
    "Avenue I",
    "Bay Pkwy",
    "Avenue N",
    "Avenue P",
    "Kings Hwy",
    "Avenue U",
    "Avenue X",
    "Neptune Av",
    "Coney Island-Stillwell Av"
  ],
  "M": [
    "Forest Hills-71 Av",
    "67 Av",
    "63 Dr-Rego Park",
    "Woodhaven Blvd",
    "Grand Av-Newtown",
    "Elmhurst Av",
    "Jackson Hts-Roosevelt Av",
    "Queens Plaza",
    "Court Sq-23 St",
    "Lexington Av/53 St",
    "5 Av/53 St",
    "47-50 Sts-Rockefeller Ctr",
    "42 St-Bryant Park",
    "34 St-Herald Sq",
    "23 St",
    "14 St",
    "W 4 St-Wash Sq",
    "Broadway-Lafayette St",
    "2 Av",
    "Delancey St-Essex St",
    "Marcy Av",
    "Hewes St",
    "Lorimer St",
    "Flushing Av",
    "Myrtle-Wyckoff Avs",
    "Seneca Av",
    "Forest Av",
    "Fresh Pond Rd",
    "Middle Village-Metropolitan Av"
  ],
  "N": [
    "Astoria-Ditmars Blvd",
    "Astoria Blvd",
    "30 Av",
    "Broadway",
    "36 Av",
    "39 Av-Dutch Kills",
    "Queensboro Plaza",
    "Lexington Av/59 St",
    "5 Av/59 St",
    "57 St-7 Av",
    "49 St",
    "Times Sq-42 St",
    "34 St-Herald Sq",
    "28 St",
    "23 St",
    "14 St-Union Sq",
    "8 St-NYU",
    "Prince St",
    "Canal St",
    "City Hall",
    "Cortlandt St",
    "Rector St",
    "Whitehall St-South Ferry",
    "Court St",
    "Jay St-MetroTech",
    "DeKalb Av",
    "Atlantic Av-Barclays Ctr",
    "36 St",
    "59 St",
    "8 Av",
    "Fort Hamilton Pkwy",
    "New Utrecht Av",
    "18 Av",
    "20 Av",
    "Bay Pkwy",
    "Kings Hwy",
    "Avenue U",
    "86 St",
    "Coney Island-Stillwell Av"
  ],
  "Q": [
    "96 St",
    "86 St",
    "72 St",
    "Lexington Av/63 St",
    "57 St-7 Av",
    "49 St",
    "Times Sq-42 St",
    "34 St-Herald Sq",
    "14 St-Union Sq",
    "Canal St",
    "DeKalb Av",
    "Atlantic Av-Barclays Ctr",
    "7 Av",
    "Prospect Park",
    "Parkside Av",
    "Church Av",
    "Beverley Rd",
    "Cortelyou Rd",
    "Newkirk Plaza",
    "Avenue H",
    "Avenue J",
    "Avenue M",
    "Kings Hwy",
    "Avenue U",
    "Neck Rd",
    "Sheepshead Bay",
    "Brighton Beach",
    "Ocean Pkwy",
    "West 8 St-NY Aquarium",
    "Coney Island-Stillwell Av"
  ],
  "R": [
    "Forest Hills-71 Av",
    "67 Av",
    "63 Dr-Rego Park",
    "Woodhaven Blvd",
    "Grand Av-Newtown",
    "Elmhurst Av",
    "Jackson Hts-Roosevelt Av",
    "Queens Plaza",
    "Lexington Av/59 St",
    "5 Av/59 St",
    "57 St-7 Av",
    "49 St",
    "Times Sq-42 St",
    "34 St-Herald Sq",
    "28 St",
    "23 St",
    "14 St-Union Sq",
    "8 St-NYU",
    "Prince St",
    "Canal St",
    "City Hall",
    "Cortlandt St",
    "Rector St",
    "Whitehall St-South Ferry",
    "Court St",
    "Jay St-MetroTech",
    "DeKalb Av",
    "Atlantic Av-Barclays Ctr",
    "Union St",
    "4 Av-9 St",
    "Prospect Av",
    "25 St",
    "36 St",
    "45 St",
    "53 St",
    "59 St",
    "Bay Ridge Av",
    "77 St",
    "86 St",
    "Bay Ridge-95 St"
  ],
  "W": [
    "Astoria-Ditmars Blvd",
    "Astoria Blvd",
    "30 Av",
    "Broadway",
    "36 Av",
    "39 Av-Dutch Kills",
    "Queensboro Plaza",
    "Lexington Av/59 St",
    "5 Av/59 St",
    "57 St-7 Av",
    "49 St",
    "Times Sq-42 St",
    "34 St-Herald Sq",
    "28 St",
    "23 St",
    "14 St-Union Sq",
    "8 St-NYU",
    "Prince St",
    "Canal St",
    "City Hall",
    "Cortlandt St",
    "Rector St",
    "Whitehall St-South Ferry"
  ],
  "L": [
    "8 Av",
    "6 Av",
    "14 St-Union Sq",
    "3 Av",
    "1 Av",
    "Bedford Av",
    "Lorimer St",
    "Graham Av",
    "Grand St",
    "Montrose Av",
    "Morgan Av",
    "Jefferson St",
    "DeKalb Av",
    "Myrtle-Wyckoff Avs",
    "Halsey St",
    "Wilson Av",
    "Bushwick Av-Aberdeen St",
    "Broadway Junction",
    "Atlantic Av",
    "Sutter Av",
    "Livonia Av",
    "New Lots Av",
    "East 105 St",
    "Canarsie-Rockaway Pkwy"
  ],
  "G": [
    "Court Sq",
    "21 St",
    "Greenpoint Av",
    "Nassau Av",
    "Metropolitan Av",
    "Broadway",
    "Flushing Av",
    "Myrtle-Willoughby Avs",
    "Bedford-Nostrand Avs",
    "Classon Av",
    "Clinton-Washington Avs",
    "Fulton St",
    "Hoyt-Schermerhorn Sts",
    "Bergen St",
    "Carroll St",
    "Smith-9 Sts",
    "4 Av-9 St",
    "7 Av",
    "15 St-Prospect Park",
    "Fort Hamilton Pkwy",
    "Church Av"
  ],
  "J": [
    "Jamaica Center-Parsons/Archer",
    "Sutphin Blvd-Archer Av-JFK",
    "Jamaica-Van Wyck",
    "121 St",
    "111 St",
    "104 St",
    "Woodhaven Blvd",
    "85 St-Forest Pkwy",
    "75 St-Elderts Ln",
    "Cypress Hills",
    "Crescent St",
    "Cleveland St",
    "Norwood Av",
    "Van Siclen Av",
    "Alabama Av",
    "Broadway Junction",
    "Chauncey St",
    "Halsey St",
    "Gates Av",
    "Kosciuszko St",
    "Myrtle Av",
    "Flushing Av",
    "Lorimer St",
    "Hewes St",
    "Marcy Av",
    "Essex St",
    "Bowery",
    "Canal St",
    "Chambers St",
    "Fulton St",
    "Broad St"
  ],
  "Z": [
    "Jamaica Center-Parsons/Archer",
    "Sutphin Blvd-Archer Av-JFK",
    "Jamaica-Van Wyck",
    "121 St",
    "111 St",
    "104 St",
    "Woodhaven Blvd",
    "85 St-Forest Pkwy",
    "75 St-Elderts Ln",
    "Cypress Hills",
    "Crescent St",
    "Cleveland St",
    "Norwood Av",
    "Van Siclen Av",
    "Alabama Av",
    "Broadway Junction",
    "Chauncey St",
    "Halsey St",
    "Gates Av",
    "Kosciuszko St",
    "Myrtle Av",
    "Flushing Av",
    "Lorimer St",
    "Hewes St",
    "Marcy Av",
    "Essex St",
    "Bowery",
    "Canal St",
    "Chambers St",
    "Fulton St",
    "Broad St"
  ],
  "SIR": [
    "St George",
    "Tompkinsville",
    "Stapleton",
    "Clifton",
    "Grasmere",
    "Old Town",
    "Dongan Hills",
    "Jefferson Av",
    "Grant City",
    "New Dorp",
    "Oakwood Heights",
    "Bay Terrace",
    "Great Kills",
    "Eltingville",
    "Annadale",
    "Huguenot",
    "Prince's Bay",
    "Pleasant Plains",
    "Richmond Valley",
    "Arthur Kill",
    "Tottenville"
  ],
  "LIRR": [
    "Penn Station",
    "Woodside",
    "Forest Hills",
    "Kew Gardens",
    "Jamaica"
  ],
  "MetroNorth": [
    "Grand Central",
    "Harlem-125 St",
    "Fordham",
    "Botanical Garden",
    "Williams Bridge"
  ],
  "PATH": [
    "World Trade Center",
    "Exchange Place",
    "Grove Street",
    "Journal Square",
    "Harrison",
    "Newark"
  ],
  "NJT": [
    "Penn Station NY",
    "Secaucus Junction",
    "Newark Penn Station",
    "Newark Broad Street",
    "Trenton"
  ]
};

const groups: GroupItem[] = [
  {
    id: "123",
    lines: [
      { id: "1", icon: train1Icon, alt: "1 train" },
      { id: "2", icon: train2Icon, alt: "2 train" },
      { id: "3", icon: train3Icon, alt: "3 train" },
    ]
  },
  {
    id: "456",
    lines: [
      { id: "4", icon: train4Icon, alt: "4 train" },
      { id: "5", icon: train5Icon, alt: "5 train" },
      { id: "6", icon: train6Icon, alt: "6 train" },
    ]
  },
  {
    id: "7",
    lines: [
      { id: "7", icon: train7Icon, alt: "7 train" },
    ]
  },
  {
    id: "ace",
    lines: [
      { id: "A", icon: trainAIcon, alt: "A train" },
      { id: "C", icon: trainCIcon, alt: "C train" },
      { id: "E", icon: trainEIcon, alt: "E train" },
    ]
  },
  {
    id: "bdfm",
    lines: [
      { id: "B", icon: trainBIcon, alt: "B train" },
      { id: "D", icon: trainDIcon, alt: "D train" },
      { id: "F", icon: trainFIcon, alt: "F train" },
      { id: "M", icon: trainMIcon, alt: "M train" },
    ]
  },
  {
    id: "nqrw",
    lines: [
      { id: "N", icon: trainNIcon, alt: "N train" },
      { id: "Q", icon: trainQIcon, alt: "Q train" },
      { id: "R", icon: trainRIcon, alt: "R train" },
      { id: "W", icon: trainWIcon, alt: "W train" },
    ]
  },
  {
    id: "l",
    lines: [
      { id: "L", icon: trainLIcon, alt: "L train" },
    ]
  },
  {
    id: "g",
    lines: [
      { id: "G", icon: trainGIcon, alt: "G train" },
    ]
  },
  {
    id: "jz",
    lines: [
      { id: "J", icon: trainJIcon, alt: "J train" },
      { id: "Z", icon: trainZIcon, alt: "Z train" },
    ]
  },
  {
    id: "regional",
    lines: [
      { id: "SIR", icon: sirIcon, alt: "SIR", size: "29px", isRegional: true },
      { id: "LIRR", icon: lirrIcon, alt: "LIRR", size: "24px", isRegional: true },
      { id: "MetroNorth", icon: metroNorthIcon, alt: "Metro-North", size: "24px", isRegional: true },
      { id: "PATH", icon: pathIcon, alt: "PATH", size: "28px", isRegional: true },
      { id: "NJT", icon: njTransitIcon, alt: "NJ Transit", size: "22px", isRegional: true },
    ]
  },
];

export default function Settings() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const stopsContainerRef = useRef<HTMLDivElement>(null);

  const checkScrollPosition = useCallback(() => {
    const container = stopsContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setCanScrollUp(scrollTop > 5);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5);
    }
  }, []);

  useEffect(() => {
    if (selectedLine) {
      setTimeout(checkScrollPosition, 50);
    }
  }, [selectedLine, checkScrollPosition]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  const handleGroupClick = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group && group.lines.length === 1) {
      // For single-line groups (7, L, G), navigate directly to stops
      setSelectedGroup(groupId);
      setSelectedLine(group.lines[0].id);
    } else {
      setSelectedGroup(groupId);
    }
  };

  const handleBack = () => {
    if (selectedLine) {
      // Check if this is a single-line group - if so, go back to main menu
      const group = groups.find(g => g.id === selectedGroup);
      setSelectedStop(null);
      if (group && group.lines.length === 1) {
        setSelectedLine(null);
        setSelectedGroup(null);
      } else {
        setSelectedLine(null);
      }
    } else {
      setSelectedGroup(null);
    }
  };

  const handleLineSelect = (lineId: string) => {
    setSelectedLine(lineId);
  };

  const handleStopSelect = (stopName: string) => {
    // Toggle selection - if same stop clicked, deselect; otherwise select
    if (selectedStop === stopName) {
      setSelectedStop(null);
    } else {
      setSelectedStop(stopName);
    }
  };

  const currentGroup = groups.find(g => g.id === selectedGroup);

  const renderMainView = () => (
    <div className="flex flex-col gap-[8px]">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex gap-[10px]">
          {row === 0 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("123")}
              data-testid="card-settings-0"
            >
              <img src={train1Icon} alt="1 train" className="w-[38px] h-[38px]" />
              <img src={train2Icon} alt="2 train" className="w-[38px] h-[38px]" />
              <img src={train3Icon} alt="3 train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 1 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("7")}
              data-testid="card-settings-2"
            >
              <img src={train7Icon} alt="7 train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 2 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("bdfm")}
              data-testid="card-settings-4"
            >
              <img src={trainBIcon} alt="B train" className="w-[38px] h-[38px]" />
              <img src={trainDIcon} alt="D train" className="w-[38px] h-[38px]" />
              <img src={trainFIcon} alt="F train" className="w-[38px] h-[38px]" />
              <img src={trainMIcon} alt="M train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 3 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("l")}
              data-testid="card-settings-6"
            >
              <img src={trainLIcon} alt="L train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 4 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("jz")}
              data-testid="card-settings-8"
            >
              <img src={trainJIcon} alt="J train" className="w-[38px] h-[38px]" />
              <img src={trainZIcon} alt="Z train" className="w-[38px] h-[38px]" />
            </div>
          ) : null}
          {row === 0 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("456")}
              data-testid="card-settings-1"
            >
              <img src={train4Icon} alt="4 train" className="w-[38px] h-[38px]" />
              <img src={train5Icon} alt="5 train" className="w-[38px] h-[38px]" />
              <img src={train6Icon} alt="6 train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 1 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("ace")}
              data-testid="card-settings-3"
            >
              <img src={trainAIcon} alt="A train" className="w-[38px] h-[38px]" />
              <img src={trainCIcon} alt="C train" className="w-[38px] h-[38px]" />
              <img src={trainEIcon} alt="E train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 2 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("nqrw")}
              data-testid="card-settings-5"
            >
              <img src={trainNIcon} alt="N train" className="w-[38px] h-[38px]" />
              <img src={trainQIcon} alt="Q train" className="w-[38px] h-[38px]" />
              <img src={trainRIcon} alt="R train" className="w-[38px] h-[38px]" />
              <img src={trainWIcon} alt="W train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 3 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("g")}
              data-testid="card-settings-7"
            >
              <img src={trainGIcon} alt="G train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 4 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-[30px] cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("regional")}
              data-testid="card-settings-9"
            >
              <img src={sirIcon} alt="SIR" className="w-[29px] h-[29px]" />
              <div className="flex flex-col items-center gap-1">
                <img src={lirrIcon} alt="LIRR" className="h-[15.4px] object-contain" style={{ transform: 'translateX(-3px)' }} />
                <img src={metroNorthIcon} alt="Metro-North" className="h-[15.4px] object-contain" />
              </div>
              <img src={pathIcon} alt="PATH" className="h-[21px] object-contain" />
              <img src={njTransitIcon} alt="NJ Transit" className="h-[14px] object-contain" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );

  const renderSubView = () => {
    if (!currentGroup) return null;
    
    return (
      <div 
        className="flex items-center justify-center"
        style={{ width: '760px', height: '370px', margin: 'auto' }}
      >
        <div className="flex flex-col gap-[8px] items-center">
          {currentGroup.lines.map((line) => (
            <div 
              key={line.id}
              className="rounded-[6px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleLineSelect(line.id)}
              data-testid={`card-line-${line.id}`}
            >
              <img 
                src={line.icon} 
                alt={line.alt} 
                className={line.isRegional ? "object-contain" : "w-[38px] h-[38px]"}
                style={line.isRegional ? { height: line.size } : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStopsView = () => {
    if (!selectedLine) return null;
    
    const stops = lineStops[selectedLine] || [];
    const lineColor = lineColors[selectedLine] || '#FFFFFF';
    
    return (
      <div 
        className="flex items-center"
        style={{ width: '760px', height: '370px', margin: 'auto', paddingLeft: '200px' }}
      >
        {/* Station list container */}
        <div 
          className="relative flex flex-col"
          style={{ height: '370px', flexShrink: 0 }}
        >
          {canScrollUp && (
            <div 
              className="absolute z-20"
              style={{ top: '-30px', left: '50px' }}
              data-testid="scroll-up-indicator"
            >
              <ChevronUp className="w-5 h-5 text-white/60" />
            </div>
          )}
          
          <div 
            ref={stopsContainerRef}
            className="overflow-y-auto h-full"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            onScroll={checkScrollPosition}
            data-testid="stops-container"
          >
            <style>{`
              [data-testid="stops-container"]::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex flex-col py-4" style={{ overflow: 'visible' }}>
              {stops.map((stop, index) => (
                <div 
                  key={index}
                  className="flex items-start"
                  style={{ flexShrink: 0 }}
                >
                  {/* Circle and line column */}
                  <div className="flex flex-col items-center mr-3">
                    <div
                      style={{ 
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#FFFFFF',
                        border: '2px solid #000000',
                        flexShrink: 0
                      }}
                    />
                    {index < stops.length - 1 && (
                      <div
                        style={{
                          width: '5px',
                          height: '18px',
                          backgroundColor: lineColor,
                          flexShrink: 0
                        }}
                      />
                    )}
                  </div>
                  {/* Text column */}
                  <div 
                    className="cursor-pointer hover:opacity-80 transition-opacity flex items-center"
                    style={{ 
                      height: '14px',
                      marginBottom: index < stops.length - 1 ? '18px' : '0'
                    }}
                    onClick={() => handleStopSelect(stop)}
                    data-testid={`stop-${index}`}
                  >
                    {selectedStop === stop ? (
                      <span
                        className="flex items-center"
                        style={{ marginLeft: '-6px', marginTop: '-6px' }}
                      >
                        <svg 
                          width="10" 
                          height="26" 
                          viewBox="0 0 10 26" 
                          style={{ marginRight: '-1px' }}
                        >
                          <path 
                            d="M10,0 L10,26 L3,16 Q0,13 3,10 L10,0 Z" 
                            fill="white"
                          />
                        </svg>
                        <span
                          style={{ 
                            fontFamily: 'Helvetica, Arial, sans-serif',
                            fontSize: '18px',
                            lineHeight: '26px',
                            color: '#000000',
                            backgroundColor: '#FFFFFF',
                            padding: '0 10px 0 4px',
                            borderRadius: '0 3px 3px 0',
                            display: 'inline-block',
                            height: '26px'
                          }}
                        >
                          {stop}
                        </span>
                        {/* Row selection buttons inline with selected station */}
                        <div 
                          className="flex flex-row gap-2 ml-4"
                          data-testid="row-selection-popup"
                        >
                          <div 
                            className="rounded-[6px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              width: '70px', 
                              height: '26px', 
                              backgroundColor: '#2D2C31'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Selected as Row 1:', selectedStop);
                              setSelectedStop(null);
                            }}
                            data-testid="button-select-row-1"
                          >
                            <span 
                              className="text-white font-medium"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '11px' }}
                            >
                              Row 1
                            </span>
                          </div>
                          <div 
                            className="rounded-[6px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              width: '70px', 
                              height: '26px', 
                              backgroundColor: '#2D2C31'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Selected as Row 2:', selectedStop);
                              setSelectedStop(null);
                            }}
                            data-testid="button-select-row-2"
                          >
                            <span 
                              className="text-white font-medium"
                              style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '11px' }}
                            >
                              Row 2
                            </span>
                          </div>
                        </div>
                      </span>
                    ) : (
                      <span
                        style={{ 
                          fontFamily: 'Helvetica, Arial, sans-serif',
                          fontSize: '18px',
                          lineHeight: '14px',
                          color: '#FFFFFF'
                        }}
                      >
                        {stop}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {canScrollDown && (
            <div 
              className="absolute z-20"
              style={{ bottom: '-30px', left: '50px' }}
              data-testid="scroll-down-indicator"
            >
              <ChevronDown className="w-5 h-5 text-white/60" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    if (selectedLine) {
      return renderStopsView();
    } else if (selectedGroup) {
      return renderSubView();
    } else {
      return renderMainView();
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: '800px', height: '480px', padding: '15px 20px' }}
          data-testid="settings-main"
        >
          {(selectedGroup || selectedLine) && (
            <div className="absolute top-[5px] left-[5px] z-30">
              <button 
                onClick={handleBack}
                className="cursor-pointer p-3"
                data-testid="button-back-to-groups"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {renderCurrentView()}

          {!selectedGroup && !selectedLine && (
            <>
              <div 
                style={{ width: '760px', height: '1px', backgroundColor: '#4a4a4a', marginTop: '20px' }}
                data-testid="separator-line"
              />

              <div 
                className="rounded-[6px] flex items-center justify-center" 
                style={{ width: '760px', height: '58px', backgroundColor: '#2D2C31', marginTop: '20px' }}
                data-testid="card-settings-bottom"
              >
                <span className="text-white text-xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Advanced Settings</span>
              </div>
            </>
          )}

          <div className="absolute bottom-[5px] left-[10px]">
            <button 
              onClick={toggleFullscreen}
              className="cursor-pointer"
              data-testid="button-fullscreen-toggle"
            >
              <Square 
                className={`w-5 h-5 ${isFullscreen ? 'text-[#ffd200]' : 'text-white'}`} 
                fill={isFullscreen ? '#ffd200' : 'none'}
              />
            </button>
          </div>
          <div className="absolute bottom-[10px] right-[10px]">
            <Link href="/" data-testid="link-back">
              <Home className="w-5 h-5 text-white cursor-pointer" data-testid="button-home" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
