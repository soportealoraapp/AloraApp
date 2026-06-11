export interface City {
    id: string;
    name: string;
    stateCode: string;
    countryCode: string;
    lat: number;
    lng: number;
    population: number;
    active?: boolean;
}

export const CITIES: City[] = [
    // México — ACTIVA
    { id: 'mx-cdmx', name: 'Ciudad de México', stateCode: 'CDMX', countryCode: 'MX', lat: 19.4326, lng: -99.1332, population: 9210000, active: true },
    { id: 'mx-guadalajara', name: 'Guadalajara', stateCode: 'JAL', countryCode: 'MX', lat: 20.6597, lng: -103.3496, population: 1495000 },
    { id: 'mx-monterrey', name: 'Monterrey', stateCode: 'NL', countryCode: 'MX', lat: 25.6866, lng: -100.3161, population: 1135000 },
    { id: 'mx-puebla', name: 'Puebla', stateCode: 'PUE', countryCode: 'MX', lat: 19.0414, lng: -98.2063, population: 1577000 },
    { id: 'mx-toluca', name: 'Toluca', stateCode: 'MEX', countryCode: 'MX', lat: 19.2826, lng: -99.6557, population: 911000 },
    { id: 'mx-leon', name: 'León', stateCode: 'GTO', countryCode: 'MX', lat: 21.1221, lng: -101.686, population: 1579000 },
    { id: 'mx-merida', name: 'Mérida', stateCode: 'YUC', countryCode: 'MX', lat: 20.9674, lng: -89.5926, population: 892000 },
    { id: 'mx-cancun', name: 'Cancún', stateCode: 'QR', countryCode: 'MX', lat: 21.1619, lng: -86.8515, population: 888000 },
    { id: 'mx-queretaro', name: 'Querétaro', stateCode: 'QRO', countryCode: 'MX', lat: 20.5888, lng: -100.3899, population: 1049000 },
    { id: 'mx-sanluis', name: 'San Luis Potosí', stateCode: 'SLP', countryCode: 'MX', lat: 22.1565, lng: -100.9855, population: 829000 },
    { id: 'mx-aguascalientes', name: 'Aguascalientes', stateCode: 'AGS', countryCode: 'MX', lat: 21.8853, lng: -102.2916, population: 932000 },
    { id: 'mx-mexicali', name: 'Mexicali', stateCode: 'BC', countryCode: 'MX', lat: 32.6278, lng: -115.4594, population: 1032000 },
    { id: 'mx-hermosillo', name: 'Hermosillo', stateCode: 'SON', countryCode: 'MX', lat: 29.0729, lng: -110.9559, population: 912000 },
    { id: 'mx-chihuahua', name: 'Chihuahua', stateCode: 'CHH', countryCode: 'MX', lat: 28.6353, lng: -106.0889, population: 925000 },
    { id: 'mx-saltillo', name: 'Saltillo', stateCode: 'COA', countryCode: 'MX', lat: 25.4232, lng: -100.9932, population: 865000 },
    { id: 'mx-tijuana', name: 'Tijuana', stateCode: 'BC', countryCode: 'MX', lat: 32.5149, lng: -117.0382, population: 1810000 },
    { id: 'mx-acapulco', name: 'Acapulco', stateCode: 'GRO', countryCode: 'MX', lat: 16.8531, lng: -99.8237, population: 687000 },
    { id: 'mx-cuernavaca', name: 'Cuernavaca', stateCode: 'MOR', countryCode: 'MX', lat: 18.9242, lng: -99.2216, population: 367000 },
    { id: 'mx-veracruz', name: 'Veracruz', stateCode: 'VER', countryCode: 'MX', lat: 19.1738, lng: -96.1342, population: 602000 },
    { id: 'mx-oaxaca', name: 'Oaxaca', stateCode: 'OAX', countryCode: 'MX', lat: 17.0732, lng: -96.7266, population: 300000 },
    // España
    { id: 'es-madrid', name: 'Madrid', stateCode: 'MD', countryCode: 'ES', lat: 40.4168, lng: -3.7038, population: 3223000 },
    { id: 'es-barcelona', name: 'Barcelona', stateCode: 'CT', countryCode: 'ES', lat: 41.3874, lng: 2.1686, population: 1620000 },
    { id: 'es-valencia', name: 'Valencia', stateCode: 'VC', countryCode: 'ES', lat: 39.4699, lng: -0.3763, population: 792000 },
    { id: 'es-sevilla', name: 'Sevilla', stateCode: 'AN', countryCode: 'ES', lat: 37.3891, lng: -5.9845, population: 689000 },
    { id: 'es-bilbao', name: 'Bilbao', stateCode: 'PV', countryCode: 'ES', lat: 43.263, lng: -2.935, population: 347000 },
    { id: 'es-malaga', name: 'Málaga', stateCode: 'AN', countryCode: 'ES', lat: 36.7213, lng: -4.4214, population: 578000 },
    { id: 'es-zaragoza', name: 'Zaragoza', stateCode: 'AR', countryCode: 'ES', lat: 41.6488, lng: -0.8891, population: 675000 },
    { id: 'es-alicante', name: 'Alicante', stateCode: 'VC', countryCode: 'ES', lat: 38.3452, lng: -0.481, population: 337000 },
    { id: 'es-cordoba', name: 'Córdoba', stateCode: 'AN', countryCode: 'ES', lat: 37.8882, lng: -4.7794, population: 326000 },
    { id: 'es-granada', name: 'Granada', stateCode: 'AN', countryCode: 'ES', lat: 37.1773, lng: -3.5986, population: 232000 },
    // Estados Unidos
    { id: 'us-ny', name: 'Nueva York', stateCode: 'NY', countryCode: 'US', lat: 40.7128, lng: -74.006, population: 8336000 },
    { id: 'us-la', name: 'Los Ángeles', stateCode: 'CA', countryCode: 'US', lat: 34.0522, lng: -118.2437, population: 3979000 },
    { id: 'us-chicago', name: 'Chicago', stateCode: 'IL', countryCode: 'US', lat: 41.8781, lng: -87.6298, population: 2693000 },
    { id: 'us-houston', name: 'Houston', stateCode: 'TX', countryCode: 'US', lat: 29.7604, lng: -95.3698, population: 2320000 },
    { id: 'us-phoenix', name: 'Phoenix', stateCode: 'AZ', countryCode: 'US', lat: 33.4484, lng: -112.074, population: 1680000 },
    { id: 'us-miami', name: 'Miami', stateCode: 'FL', countryCode: 'US', lat: 25.7617, lng: -80.1918, population: 467000 },
    { id: 'us-sf', name: 'San Francisco', stateCode: 'CA', countryCode: 'US', lat: 37.7749, lng: -122.4194, population: 873000 },
    { id: 'us-seattle', name: 'Seattle', stateCode: 'WA', countryCode: 'US', lat: 47.6062, lng: -122.3321, population: 737000 },
    { id: 'us-denver', name: 'Denver', stateCode: 'CO', countryCode: 'US', lat: 39.7392, lng: -104.9903, population: 715000 },
    { id: 'us-austin', name: 'Austin', stateCode: 'TX', countryCode: 'US', lat: 30.2672, lng: -97.7431, population: 978000 },
    { id: 'us-boston', name: 'Boston', stateCode: 'MA', countryCode: 'US', lat: 42.3601, lng: -71.0589, population: 692000 },
    { id: 'us-atlanta', name: 'Atlanta', stateCode: 'GA', countryCode: 'US', lat: 33.749, lng: -84.388, population: 498000 },
    // Colombia
    { id: 'co-bogota', name: 'Bogotá', stateCode: 'BOG', countryCode: 'CO', lat: 4.711, lng: -74.0721, population: 7413000 },
    { id: 'co-medellin', name: 'Medellín', stateCode: 'ANT', countryCode: 'CO', lat: 6.2476, lng: -75.5658, population: 2569000 },
    { id: 'co-cali', name: 'Cali', stateCode: 'VAC', countryCode: 'CO', lat: 3.4516, lng: -76.532, population: 2228000 },
    { id: 'co-barranquilla', name: 'Barranquilla', stateCode: 'ATL', countryCode: 'CO', lat: 10.9685, lng: -74.7813, population: 1232000 },
    { id: 'co-cartagena', name: 'Cartagena', stateCode: 'BOL', countryCode: 'CO', lat: 10.391, lng: -75.5144, population: 1028000 },
    // Argentina
    { id: 'ar-buenosaires', name: 'Buenos Aires', stateCode: 'CABA', countryCode: 'AR', lat: -34.6037, lng: -58.3816, population: 3075000 },
    { id: 'ar-cordoba', name: 'Córdoba', stateCode: 'COR', countryCode: 'AR', lat: -31.4201, lng: -64.1888, population: 1535000 },
    { id: 'ar-rosario', name: 'Rosario', stateCode: 'SFE', countryCode: 'AR', lat: -32.9468, lng: -60.6393, population: 1194000 },
    // Chile
    { id: 'cl-santiago', name: 'Santiago', stateCode: 'RM', countryCode: 'CL', lat: -33.4489, lng: -70.6693, population: 5614000 },
    { id: 'cl-valparaiso', name: 'Valparaíso', stateCode: 'VS', countryCode: 'CL', lat: -33.0472, lng: -71.6127, population: 284000 },
    // Perú
    { id: 'pe-lima', name: 'Lima', stateCode: 'LIM', countryCode: 'PE', lat: -12.0464, lng: -77.0428, population: 10554000 },
    // Brasil
    { id: 'br-saopaulo', name: 'São Paulo', stateCode: 'SP', countryCode: 'BR', lat: -23.5505, lng: -46.6333, population: 12330000 },
    { id: 'br-rio', name: 'Río de Janeiro', stateCode: 'RJ', countryCode: 'BR', lat: -22.9068, lng: -43.1729, population: 6748000 },
    { id: 'br-brasilia', name: 'Brasilia', stateCode: 'DF', countryCode: 'BR', lat: -15.7975, lng: -47.8919, population: 3055000 },
    // Ecuador
    { id: 'ec-quito', name: 'Quito', stateCode: 'PICH', countryCode: 'EC', lat: -0.1807, lng: -78.4678, population: 2781000 },
    { id: 'ec-guayaquil', name: 'Guayaquil', stateCode: 'GYE', countryCode: 'EC', lat: -2.171, lng: -79.9224, population: 2698000 },
    // Venezuela
    { id: 've-caracas', name: 'Caracas', stateCode: 'DC', countryCode: 'VE', lat: 10.4806, lng: -66.9036, population: 2936000 },
    // Perú
    { id: 'pe-arequipa', name: 'Arequipa', stateCode: 'ARE', countryCode: 'PE', lat: -16.409, lng: -71.5375, population: 1008000 },
    // Cuba
    { id: 'cu-lahabana', name: 'La Habana', stateCode: 'LH', countryCode: 'CU', lat: 23.1136, lng: -82.3666, population: 2141000 },
    // Rep. Dominicana
    { id: 'do-santodomingo', name: 'Santo Domingo', stateCode: 'DN', countryCode: 'DO', lat: 18.4861, lng: -69.9312, population: 1029000 },
    // Guatemala
    { id: 'gt-guatemala', name: 'Ciudad de Guatemala', stateCode: 'CMT', countryCode: 'GT', lat: 14.6349, lng: -90.5069, population: 1010000 },
    // Costa Rica
    { id: 'cr-sanjose', name: 'San José', stateCode: 'SJ', countryCode: 'CR', lat: 9.9281, lng: -84.0907, population: 342000 },
    // Panamá
    { id: 'pa-ciudadpanama', name: 'Ciudad de Panamá', stateCode: 'PN', countryCode: 'PA', lat: 8.9824, lng: -79.5199, population: 880000 },
    // Uruguay
    { id: 'uy-montevideo', name: 'Montevideo', stateCode: 'MO', countryCode: 'UY', lat: -34.9011, lng: -56.1645, population: 1319000 },
    // Paraguay
    { id: 'py-asuncion', name: 'Asunción', stateCode: 'ASU', countryCode: 'PY', lat: -25.2637, lng: -57.5759, population: 525000 },
    // Bolivia
    { id: 'bo-lapaz', name: 'La Paz', stateCode: 'LPZ', countryCode: 'BO', lat: -16.5, lng: -68.15, population: 812000 },
    { id: 'bo-santacruz', name: 'Santa Cruz de la Sierra', stateCode: 'SCZ', countryCode: 'BO', lat: -17.7833, lng: -63.1821, population: 1831000 },
    // Honduras
    { id: 'hn-tegucigalpa', name: 'Tegucigalpa', stateCode: 'FM', countryCode: 'HN', lat: 14.0723, lng: -87.1921, population: 1126000 },
    // El Salvador
    { id: 'sv-san salvador', name: 'San Salvador', stateCode: 'SS', countryCode: 'SV', lat: 13.6929, lng: -89.2182, population: 570000 },
    // Nicaragua
    { id: 'ni-managua', name: 'Managua', stateCode: 'MN', countryCode: 'NI', lat: 12.115, lng: -86.2362, population: 1042000 },
    // Puerto Rico
    { id: 'pr-sanjuan', name: 'San Juan', stateCode: 'SJ', countryCode: 'PR', lat: 18.4655, lng: -66.1057, population: 342000 },
    // Alemania
    { id: 'de-berlin', name: 'Berlín', stateCode: 'BE', countryCode: 'DE', lat: 52.52, lng: 13.405, population: 3645000 },
    { id: 'de-munich', name: 'Múnich', stateCode: 'BY', countryCode: 'DE', lat: 48.1351, lng: 11.582, population: 1488000 },
    { id: 'de-hamburg', name: 'Hamburgo', stateCode: 'HH', countryCode: 'DE', lat: 53.5511, lng: 9.9937, population: 1899000 },
    // Francia
    { id: 'fr-paris', name: 'París', stateCode: 'IDF', countryCode: 'FR', lat: 48.8566, lng: 2.3522, population: 2161000 },
    { id: 'fr-marsella', name: 'Marsella', stateCode: 'PAC', countryCode: 'FR', lat: 43.2965, lng: 5.3698, population: 870000 },
    // Italia
    { id: 'it-roma', name: 'Roma', stateCode: 'LAZ', countryCode: 'IT', lat: 41.9028, lng: 12.4964, population: 2873000 },
    { id: 'it-milan', name: 'Milán', stateCode: 'LOM', countryCode: 'IT', lat: 45.4642, lng: 9.19, population: 1396000 },
    // Portugal
    { id: 'pt-lisboa', name: 'Lisboa', stateCode: 'LIS', countryCode: 'PT', lat: 38.7223, lng: -9.1393, population: 545000 },
    // Reino Unido
    { id: 'gb-londres', name: 'Londres', stateCode: 'ENG', countryCode: 'GB', lat: 51.5074, lng: -0.1278, population: 8982000 },
    // Países Bajos
    { id: 'nl-amsterdam', name: 'Ámsterdam', stateCode: 'NH', countryCode: 'NL', lat: 52.3676, lng: 4.9041, population: 872000 },
    // Bélgica
    { id: 'be-bruselas', name: 'Bruselas', stateCode: 'BRU', countryCode: 'BE', lat: 50.8503, lng: 4.3517, population: 185000 },
    // Suiza
    { id: 'ch-zurich', name: 'Zúrich', stateCode: 'ZH', countryCode: 'CH', lat: 47.3769, lng: 8.5417, population: 434000 },
    // Suecia
    { id: 'se-estocolmo', name: 'Estocolmo', stateCode: 'AB', countryCode: 'SE', lat: 59.3293, lng: 18.0686, population: 975000 },
    // Noruega
    { id: 'no-oslo', name: 'Oslo', stateCode: 'OS', countryCode: 'NO', lat: 59.9139, lng: 10.7522, population: 693000 },
    // Dinamarca
    { id: 'dk-copenhague', name: 'Copenhague', stateCode: 'H', countryCode: 'DK', lat: 55.6761, lng: 12.5683, population: 794000 },
    // Polonia
    { id: 'pl-varsobia', name: 'Varsovia', stateCode: 'MZ', countryCode: 'PL', lat: 52.2297, lng: 21.0122, population: 1794000 },
    // Turquía
    { id: 'tr-estambul', name: 'Estambul', stateCode: 'ST', countryCode: 'TR', lat: 41.0082, lng: 28.9784, population: 1546000 },
    // Japón
    { id: 'jp-tokio', name: 'Tokio', stateCode: 'TK', countryCode: 'JP', lat: 35.6762, lng: 139.6503, population: 13960000 },
    // Corea del Sur
    { id: 'kr-seul', name: 'Seúl', stateCode: 'SE', countryCode: 'KR', lat: 37.5665, lng: 126.978, population: 9776000 },
    // Australia
    { id: 'au-sidney', name: 'Sídney', stateCode: 'NSW', countryCode: 'AU', lat: -33.8688, lng: 151.2093, population: 5312000 },
    // India
    { id: 'in-mumbai', name: 'Bombay', stateCode: 'MH', countryCode: 'IN', lat: 19.076, lng: 72.8777, population: 12478000 },
    // Israel
    { id: 'il-telaviv', name: 'Tel Aviv', stateCode: 'TA', countryCode: 'IL', lat: 32.0853, lng: 34.7818, population: 460000 },
    // Marruecos
    { id: 'ma-casablanca', name: 'Casablanca', stateCode: 'CAS', countryCode: 'MA', lat: 33.5731, lng: -7.5898, population: 3359000 },
];

export function getActiveCities(): City[] {
    return CITIES.filter(city => city.active === true);
}

export function isCityActive(cityId: string): boolean {
    const city = CITIES.find(c => c.id === cityId);
    return city?.active === true;
}
