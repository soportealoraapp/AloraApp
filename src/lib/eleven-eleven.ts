/**
 * 11:11 cosmic-reset helpers.
 *
 * Likes ("Destellos del universo") recharge every 12 hours, anchored at
 * 11:11 AM and 11:11 PM in *each user's local timezone*. These pure helpers
 * are safe to import from both server and client code.
 */

export interface ElevenElevenBoundaries {
    /** Most recent 11:11 (AM or PM) boundary that is <= `now` in `timezone`. */
    last: Date;
    /** Next 11:11 boundary that is > `now` in `timezone`. */
    next: Date;
}

interface WallParts {
    year: number;
    month: number; // 0-based
    day: number;
    hour: number; // 0-23
    minute: number;
    second: number;
}

function wallClockParts(ref: Date, timezone?: string): WallParts {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone || 'UTC',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const map: Record<string, string> = {};
    for (const part of fmt.formatToParts(ref)) {
        if (part.type !== 'literal') map[part.type] = part.value;
    }

    let hour = parseInt(map.hour, 10);
    if (hour === 24) hour = 0;

    return {
        year: parseInt(map.year, 10),
        month: parseInt(map.month, 10) - 1,
        day: parseInt(map.day, 10),
        hour,
        minute: parseInt(map.minute, 10),
        second: parseInt(map.second, 10),
    };
}

/** Milliseconds that `timeZone` is ahead of UTC at `date` (positive = ahead). */
function getTimezoneOffsetMs(timeZone: string, date: Date): number {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    return tzDate.getTime() - utcDate.getTime();
}

/** Absolute Date for 11:11 AM (pm=false) or 11:11 PM (pm=true) on `ref`'s calendar date in `timezone`. */
function elevenElevenOn(ref: Date, pm: boolean, timezone?: string): Date {
    const wc = wallClockParts(ref, timezone);
    const hour = pm ? 23 : 11;
    // Build the wall-clock time as if it were UTC, then shift by the real tz offset
    // so the resulting Date is the true UTC instant of that local 11:11.
    const wall = new Date(Date.UTC(wc.year, wc.month, wc.day, hour, 11, 0, 0));
    if (!timezone || timezone === 'UTC') return wall;
    const offset = getTimezoneOffsetMs(timezone, wall);
    return new Date(wall.getTime() - offset);
}

export function getElevenElevenBoundaries(now: Date = new Date(), timezone?: string): ElevenElevenBoundaries {
    const am = elevenElevenOn(now, false, timezone);
    const pm = elevenElevenOn(now, true, timezone);

    let last: Date;
    let next: Date;

    if (now >= pm) {
        last = pm;
        next = elevenElevenOn(new Date(now.getTime() + 24 * 60 * 60 * 1000), false, timezone);
    } else if (now >= am) {
        last = am;
        next = pm;
    } else {
        last = elevenElevenOn(new Date(now.getTime() - 24 * 60 * 60 * 1000), true, timezone);
        next = am;
    }

    return { last, next };
}

/** Human label like "11:11 PM" / "11:11 AM" in `timezone` (defaults to the Date's local time). */
export function getElevenElevenLabel(date: Date, timezone?: string): string {
    const hour = timezone ? wallClockParts(date, timezone).hour : date.getHours();
    return `11:11 ${hour >= 12 ? 'PM' : 'AM'}`;
}

/** Countdown formatted as "03h 11m" (seconds hidden to match the product copy). */
export function formatCountdown(target: Date, now: Date = new Date(), withSeconds = false): string {
    let diff = target.getTime() - now.getTime();
    if (diff < 0) diff = 0;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const base = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
    return withSeconds ? `${base} ${String(seconds).padStart(2, '0')}s` : base;
}
