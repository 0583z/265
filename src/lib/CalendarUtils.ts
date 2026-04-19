/**
 * Utility to generate and download .ics files for calendar events
 */

export interface CalendarEvent {
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  location?: string;
}

export function generateIcsFile(event: CalendarEvent): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + 'Z';
    } catch (e) {
      return '';
    }
  };

  const start = formatDate(event.startTime);
  const end = event.endTime ? formatDate(event.endTime) : formatDate(new Date(new Date(event.startTime).getTime() + 60 * 60 * 1000).toISOString());
  const now = formatDate(new Date().toISOString());

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//College Competition Hub//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');
}

export function downloadICS(event: CalendarEvent) {
  const icsData = generateIcsFile(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
