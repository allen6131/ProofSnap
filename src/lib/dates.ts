const DATE_TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
});

const MONTH_KEY_FORMAT = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
});

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) {
    return 'Not set';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return DATE_TIME_FORMAT.format(date);
}

export function formatDate(iso?: string | null): string {
  if (!iso) {
    return 'Not set';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return DATE_FORMAT.format(date);
}

export function getMonthKey(date: Date = new Date()): string {
  return MONTH_KEY_FORMAT.format(date);
}
