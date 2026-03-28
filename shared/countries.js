const rawCountryOptions = [
  'Antigua y Barbuda',
  'Argentina',
  'Bahamas',
  'Barbados',
  'Belice',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Chile',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Dominica',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Granada',
  'Guatemala',
  'Guyana',
  'Haití',
  'Honduras',
  'Jamaica',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Puerto Rico',
  'República Dominicana',
  'San Cristóbal y Nieves',
  'San Vicente y las Granadinas',
  'Santa Lucía',
  'Surinam',
  'Trinidad y Tobago',
  'Uruguay',
  'Venezuela'
];

const rawCallingCodes = {
  'Antigua y Barbuda': '1268',
  'Argentina': '54',
  'Bahamas': '1242',
  'Barbados': '1246',
  'Belice': '501',
  'Bolivia': '591',
  'Brasil': '55',
  'Canadá': '1',
  'Chile': '56',
  'Colombia': '57',
  'Costa Rica': '506',
  'Cuba': '53',
  'Dominica': '1767',
  'Ecuador': '593',
  'El Salvador': '503',
  'España': '34',
  'Estados Unidos': '1',
  'Granada': '1473',
  'Guatemala': '502',
  'Guyana': '592',
  'Haití': '509',
  'Honduras': '504',
  'Jamaica': '1876',
  'México': '52',
  'Nicaragua': '505',
  'Panamá': '507',
  'Paraguay': '595',
  'Perú': '51',
  'Puerto Rico': '1',
  'República Dominicana': '1',
  'San Cristóbal y Nieves': '1869',
  'San Vicente y las Granadinas': '1784',
  'Santa Lucía': '1758',
  'Surinam': '597',
  'Trinidad y Tobago': '1868',
  'Uruguay': '598',
  'Venezuela': '58'
};

const rawCountryCodes = {
  'Antigua y Barbuda': 'AG',
  'Argentina': 'AR',
  'Bahamas': 'BS',
  'Barbados': 'BB',
  'Belice': 'BZ',
  'Bolivia': 'BO',
  'Brasil': 'BR',
  'Canadá': 'CA',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Costa Rica': 'CR',
  'Cuba': 'CU',
  'Dominica': 'DM',
  'Ecuador': 'EC',
  'El Salvador': 'SV',
  'España': 'ES',
  'Estados Unidos': 'US',
  'Granada': 'GD',
  'Guatemala': 'GT',
  'Guyana': 'GY',
  'Haití': 'HT',
  'Honduras': 'HN',
  'Jamaica': 'JM',
  'México': 'MX',
  'Nicaragua': 'NI',
  'Panamá': 'PA',
  'Paraguay': 'PY',
  'Perú': 'PE',
  'Puerto Rico': 'PR',
  'República Dominicana': 'DR',
  'San Cristóbal y Nieves': 'KN',
  'San Vicente y las Granadinas': 'VC',
  'Santa Lucía': 'LC',
  'Surinam': 'SR',
  'Trinidad y Tobago': 'TT',
  'Uruguay': 'UY',
  'Venezuela': 'VE'
};

const rawAliases = {
  'republica dominicana': 'República Dominicana',
  'rep dominicana': 'República Dominicana',
  'rep. dominicana': 'República Dominicana',
  'dominican republic': 'República Dominicana',
  'mexico': 'México',
  'peru': 'Perú',
  'haiti': 'Haití',
  'panama': 'Panamá',
  'canada': 'Canadá',
  'espana': 'España',
  'eeuu': 'Estados Unidos',
  'estados unidos de america': 'Estados Unidos',
  'united states': 'Estados Unidos'
};

const normalizeCountryLookupKey = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const buildLookupMap = () => {
  const map = new Map();

  rawCountryOptions.forEach((country) => {
    map.set(normalizeCountryLookupKey(country), country);
  });

  Object.entries(rawAliases).forEach(([alias, canonical]) => {
    map.set(normalizeCountryLookupKey(alias), canonical);
  });

  return map;
};

const countryLookup = buildLookupMap();

export const COUNTRY_OPTIONS = Object.freeze([...rawCountryOptions]);
export const COUNTRY_CALLING_CODES = Object.freeze({ ...rawCallingCodes });
export const COUNTRY_CODE_BY_NAME = Object.freeze({ ...rawCountryCodes });

export const normalizeCountryName = (value = '', options = {}) => {
  const { allowCustom = true } = options;
  const raw = String(value || '').trim();
  if (!raw) return '';

  const canonical = countryLookup.get(normalizeCountryLookupKey(raw));
  if (canonical) return canonical;
  return allowCustom ? raw : '';
};

export const normalizeKnownCountryName = (value = '') =>
  normalizeCountryName(value, { allowCustom: false });

export const getCountryCallingCode = (value = '') => {
  const canonical = normalizeCountryName(value);
  return COUNTRY_CALLING_CODES[canonical] || '';
};

export const isKnownCountryName = (value = '') => {
  const canonical = normalizeCountryName(value, { allowCustom: false });
  return Boolean(canonical);
};
