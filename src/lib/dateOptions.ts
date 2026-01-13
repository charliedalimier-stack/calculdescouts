// Centralized date options for the application
// Period: 2025 to 2030

export const YEAR_START = 2025;
export const YEAR_END = 2030;

export const getYearOptions = () => {
  const years = [];
  for (let year = YEAR_START; year <= YEAR_END; year++) {
    years.push({
      value: year.toString(),
      label: year.toString(),
    });
  }
  return years;
};

export const getMonthOptions = (includeAllMonths = false) => {
  const options = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  
  // Generate months for the valid year range
  for (let year = YEAR_START; year <= YEAR_END; year++) {
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const value = date.toISOString().slice(0, 7) + '-01';
      const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      // If not includeAllMonths, only show a reasonable window around current date
      if (!includeAllMonths) {
        const monthsDiff = (year - currentYear) * 12 + (month - currentMonth);
        if (monthsDiff < -12 || monthsDiff > 24) continue;
      }
      
      options.push({ value, label });
    }
  }
  return options;
};

export const getCurrentMonth = () => {
  const now = new Date();
  // Ensure we're within valid range
  if (now.getFullYear() < YEAR_START) {
    return `${YEAR_START}-01-01`;
  }
  if (now.getFullYear() > YEAR_END) {
    return `${YEAR_END}-12-01`;
  }
  return now.toISOString().slice(0, 7) + '-01';
};

export const getCurrentYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  // Ensure we're within valid range
  if (year < YEAR_START) return YEAR_START;
  if (year > YEAR_END) return YEAR_END;
  return year;
};

export const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export const MONTH_LABELS_FULL = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
