/**
 * A compact reference set of large urban areas, used only to estimate how many people
 * sit near a signal. Figures are metropolitan-area magnitudes, not precise censuses,
 * and every consumer must present the result as an estimate.
 */
export interface PopCity {
  name: string;
  country: string;
  lat: number;
  lng: number;
  /** Metro population, millions. */
  pop: number;
}

export const POP_CITIES: PopCity[] = [
  { name: "Tokyo", country: "Japan", lat: 35.69, lng: 139.69, pop: 37 },
  { name: "Delhi", country: "India", lat: 28.61, lng: 77.21, pop: 32 },
  { name: "Shanghai", country: "China", lat: 31.23, lng: 121.47, pop: 29 },
  { name: "Dhaka", country: "Bangladesh", lat: 23.81, lng: 90.41, pop: 23 },
  { name: "São Paulo", country: "Brazil", lat: -23.55, lng: -46.63, pop: 22 },
  { name: "Cairo", country: "Egypt", lat: 30.04, lng: 31.24, pop: 22 },
  { name: "Mexico City", country: "Mexico", lat: 19.43, lng: -99.13, pop: 22 },
  { name: "Beijing", country: "China", lat: 39.9, lng: 116.4, pop: 22 },
  { name: "Mumbai", country: "India", lat: 19.08, lng: 72.88, pop: 21 },
  { name: "Osaka", country: "Japan", lat: 34.69, lng: 135.5, pop: 19 },
  { name: "New York", country: "United States", lat: 40.71, lng: -74.01, pop: 19 },
  { name: "Karachi", country: "Pakistan", lat: 24.86, lng: 67.01, pop: 17 },
  { name: "Buenos Aires", country: "Argentina", lat: -34.6, lng: -58.38, pop: 15 },
  { name: "Istanbul", country: "Türkiye", lat: 41.01, lng: 28.98, pop: 15 },
  { name: "Kolkata", country: "India", lat: 22.57, lng: 88.36, pop: 15 },
  { name: "Manila", country: "Philippines", lat: 14.6, lng: 120.98, pop: 14 },
  { name: "Lagos", country: "Nigeria", lat: 6.52, lng: 3.38, pop: 15 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.91, lng: -43.17, pop: 13 },
  { name: "Guangzhou", country: "China", lat: 23.13, lng: 113.26, pop: 13 },
  { name: "Los Angeles", country: "United States", lat: 34.05, lng: -118.24, pop: 12 },
  { name: "Moscow", country: "Russia", lat: 55.76, lng: 37.62, pop: 12 },
  { name: "Kinshasa", country: "DR Congo", lat: -4.44, lng: 15.27, pop: 16 },
  { name: "Lima", country: "Peru", lat: -12.05, lng: -77.04, pop: 11 },
  { name: "Bangkok", country: "Thailand", lat: 13.76, lng: 100.5, pop: 11 },
  { name: "Tehran", country: "Iran", lat: 35.69, lng: 51.39, pop: 10 },
  { name: "Jakarta", country: "Indonesia", lat: -6.21, lng: 106.85, pop: 11 },
  { name: "Seoul", country: "South Korea", lat: 37.57, lng: 126.98, pop: 10 },
  { name: "London", country: "United Kingdom", lat: 51.51, lng: -0.13, pop: 9 },
  { name: "Paris", country: "France", lat: 48.86, lng: 2.35, pop: 11 },
  { name: "Bogotá", country: "Colombia", lat: 4.71, lng: -74.07, pop: 11 },
  { name: "Chicago", country: "United States", lat: 41.88, lng: -87.63, pop: 9 },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.82, lng: 106.63, pop: 9 },
  { name: "Hong Kong", country: "China", lat: 22.32, lng: 114.17, pop: 8 },
  { name: "Santiago", country: "Chile", lat: -33.45, lng: -70.67, pop: 7 },
  { name: "Madrid", country: "Spain", lat: 40.42, lng: -3.7, pop: 7 },
  { name: "Nairobi", country: "Kenya", lat: -1.29, lng: 36.82, pop: 6 },
  { name: "Johannesburg", country: "South Africa", lat: -26.2, lng: 28.05, pop: 6 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.4, pop: 6 },
  { name: "Taipei", country: "Taiwan", lat: 25.03, lng: 121.57, pop: 7 },
  { name: "Sydney", country: "Australia", lat: -33.87, lng: 151.21, pop: 5 },
  { name: "Toronto", country: "Canada", lat: 43.65, lng: -79.38, pop: 6 },
  { name: "Casablanca", country: "Morocco", lat: 33.57, lng: -7.59, pop: 4 },
  { name: "Rome", country: "Italy", lat: 41.9, lng: 12.5, pop: 4 },
  { name: "Athens", country: "Greece", lat: 37.98, lng: 23.73, pop: 3 },
  { name: "Lisbon", country: "Portugal", lat: 38.72, lng: -9.14, pop: 3 },
  { name: "Warsaw", country: "Poland", lat: 52.23, lng: 21.01, pop: 3 },
  { name: "Kyiv", country: "Ukraine", lat: 50.45, lng: 30.52, pop: 3 },
  { name: "Vancouver", country: "Canada", lat: 49.28, lng: -123.12, pop: 3 },
  { name: "San Francisco", country: "United States", lat: 37.77, lng: -122.42, pop: 5 },
  { name: "Wellington", country: "New Zealand", lat: -41.29, lng: 174.78, pop: 0.4 },
];
