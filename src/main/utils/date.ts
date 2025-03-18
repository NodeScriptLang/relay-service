export const MINUTE_SECONDS = 60;
export const HOUR_SECONDS = 60 * MINUTE_SECONDS;

export function getDate(date: number | Date = new Date()) {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

export function getHour(date: number | Date = new Date()) {
    const d = new Date(date);
    return d.toISOString().split('T')[1].split(':')[0];
}
