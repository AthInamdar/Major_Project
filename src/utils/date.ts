export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getDaysFromNow = (date: Date): number => {
  const now = new Date();
  const timeDiff = date.getTime() - now.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

export const isExpired = (date: Date): boolean => {
  return date.getTime() < new Date().getTime();
};

export const parseExpiryDate = (dateString: string): Date | null => {
  // Handle various date formats: MM/YYYY, DD/MM/YYYY, MMM YYYY
  const formats = [
    /^(\d{2})\/(\d{4})$/, // MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // D/M/YYYY or DD/M/YYYY
    /^([A-Za-z]{3})\s?(\d{4})$/, // MMM YYYY
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      if (format === formats[0]) {
        // MM/YYYY - assume last day of month
        const month = parseInt(match[1]) - 1;
        const year = parseInt(match[2]);
        return new Date(year, month + 1, 0); // Last day of month
      } else if (format === formats[1] || format === formats[2]) {
        // DD/MM/YYYY
        const day = parseInt(match[1]);
        const month = parseInt(match[2]) - 1;
        const year = parseInt(match[3]);
        return new Date(year, month, day);
      } else if (format === formats[3]) {
        // MMM YYYY
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun',
                           'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.indexOf(match[1].toLowerCase());
        if (monthIndex !== -1) {
          const year = parseInt(match[2]);
          return new Date(year, monthIndex + 1, 0); // Last day of month
        }
      }
    }
  }

  return null;
};
