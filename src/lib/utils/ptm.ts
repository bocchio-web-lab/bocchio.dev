export function formatDuration(minutes: number | string | null | undefined): string {
    if (minutes === null || minutes === undefined || minutes === "")
        return "0 min";

    const numeric = typeof minutes === "string" ? Number(minutes) : minutes;
    if (!Number.isFinite(numeric)) return String(minutes);

    return `${Math.floor(numeric / 60)}h ${(numeric % 60).toString().padStart(2, "0")}m`;
}

export function currencySymbol(currency: string) {
    switch (currency) {
        case "EUR":
            return "€";
        case "USD":
            return "$";
        default:
            return currency;
    }
}


export function buildTenantHeaders(tenantId: number | string) {
    return { 'X-Tenant-ID': String(tenantId) };
}

export function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
    if (value === null) {
        return null;
    }

    const text = value.toString().trim();
    if (!text) {
        return null;
    }

    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseRequiredNumber(value: FormDataEntryValue | null): number {
    const parsed = parseOptionalNumber(value);
    return parsed ?? 0;
}

export function parseIdList(value: FormDataEntryValue | null): Array<number> {
    if (value === null) {
        return [];
    }

    return value
        .toString()
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
}

export function safeJsonParse<T>(value: string | null | undefined): T | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

export function formatDate(value: string | null | undefined): string {
    if (!value) {
        return 'Unknown';
    }

    return new Date(value).toLocaleDateString();
}

export function formatDateTime(value: string | null | undefined): string {
    if (!value) {
        return 'Unknown';
    }

    return new Date(value).toLocaleString();
}

export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '0';
    }

    const numeric = typeof value === 'string' ? Number(value) : value;
    return Number.isFinite(numeric) ? new Intl.NumberFormat().format(numeric) : String(value);
}