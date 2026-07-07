export const HKS_OFFICES = [
  { city: "Dallas",         state: "TX", country: "USA",           lat: 32.7826,  lng: -96.7997,  address: "350 N Saint Paul Street, Suite 100" },
  { city: "Los Angeles",    state: "CA", country: "USA",           lat: 34.0177,  lng: -118.3899, address: "8665 Hayden Place, Culver City" },
  { city: "Washington",     state: "DC", country: "USA",           lat: 38.9003,  lng: -77.0395,  address: "1775 Eye Street NW, Suite 1150" },
  { city: "Atlanta",        state: "GA", country: "USA",           lat: 33.7579,  lng: -84.3881,  address: "191 Peachtree Street NE, Suite 3300" },
  { city: "Austin",         state: "TX", country: "USA",           lat: 30.2684,  lng: -97.7427,  address: "101 West 6th Street, Suite 300" },
  { city: "Chicago",        state: "IL", country: "USA",           lat: 41.8827,  lng: -87.6321,  address: "125 South Clark Street, Suite 1100" },
  { city: "Denver",         state: "CO", country: "USA",           lat: 39.7470,  lng: -104.9887, address: "1801 California Street, Suite 2400" },
  { city: "Detroit",        state: "MI", country: "USA",           lat: 42.3328,  lng: -83.0458,  address: "1001 Woodward Avenue, Suite 500" },
  { city: "Fort Worth",     state: "TX", country: "USA",           lat: 32.7563,  lng: -97.3307,  address: "811 Main Street, Suite 2400" },
  { city: "Houston",        state: "TX", country: "USA",           lat: 29.7366,  lng: -95.4297,  address: "3737 Buffalo Speedway, Suite 1200" },
  { city: "Miami",          state: "FL", country: "USA",           lat: 25.7650,  lng: -80.1936,  address: "701 Brickell Avenue, Suite 1550" },
  { city: "New York",       state: "NY", country: "USA",           lat: 40.7694,  lng: -73.9822,  address: "157 Columbus Avenue, 4th Floor" },
  { city: "Orlando",        state: "FL", country: "USA",           lat: 28.5494,  lng: -81.3789,  address: "350 North Orange Avenue, Suite 1100" },
  { city: "Phoenix",        state: "AZ", country: "USA",           lat: 33.5086,  lng: -111.9998, address: "3131 East Camelback Road, Suite 400" },
  { city: "Raleigh",        state: "NC", country: "USA",           lat: 35.7788,  lng: -78.6433,  address: "1 Glenwood Avenue, Suite 500" },
  { city: "Richmond",       state: "VA", country: "USA",           lat: 37.5339,  lng: -77.4344,  address: "901 East Byrd Street, Suite 1400" },
  { city: "Salt Lake City", state: "UT", country: "USA",           lat: 40.7659,  lng: -111.8906, address: "222 South Main Street, Suite 500" },
  { city: "San Francisco",  state: "CA", country: "USA",           lat: 37.7879,  lng: -122.3975, address: "55 Second Street, Suite 1500" },
  { city: "Seattle",        state: "WA", country: "USA",           lat: 47.6063,  lng: -122.3331, address: "1201 Third Avenue, Suite 2200" },
  // International offices
  { city: "Brisbane",       state: null, country: "Australia",     lat: -27.4698, lng: 153.0251,  address: "Level 15, 270 Adelaide Street, Brisbane QLD 4000" },
  { city: "London",         state: null, country: "United Kingdom", lat: 51.5072, lng: -0.1276,   address: "10 Lower Thames Street, London EC3R 6AF" },
  { city: "Mexico City",    state: null, country: "Mexico",        lat: 19.4326,  lng: -99.1332,  address: "Montes Urales 424, Lomas de Chapultepec" },
  { city: "Gurugram",       state: null, country: "India",         lat: 28.4595,  lng: 77.0266,   address: "The Circle, Unitech Trade Center, 1st Floor, Sector 43, Gurugram, Haryana 122022" },
  { city: "Dubai",          state: null, country: "UAE",           lat: 25.2048,  lng: 55.2708,   address: "Marina Plaza, Level 27, Dubai Marina" },
  { city: "Riyadh",         state: null, country: "Saudi Arabia",  lat: 24.7136,  lng: 46.6753,   address: "Riyadh, Saudi Arabia" },
  { city: "Singapore",      state: null, country: "Singapore",     lat: 1.3521,   lng: 103.8198,  address: "Singapore" },
  { city: "Tokyo",          state: null, country: "Japan",         lat: 35.6764,  lng: 139.6500,  address: "Tokyo, Japan" },
] as const;

export type HKSOffice = typeof HKS_OFFICES[number];

import { haversine } from "@/lib/helpers";

export interface OfficeDistance {
  office: HKSOffice;
  miles: number;
}

/** HKS offices sorted by straight-line distance from a point, nearest first. */
export function nearestOffices(lat: number, lng: number, limit = 3): OfficeDistance[] {
  return HKS_OFFICES
    .map((office) => ({ office, miles: haversine(lat, lng, office.lat, office.lng) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit);
}
