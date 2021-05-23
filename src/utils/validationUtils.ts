export function oneOf(values: (string | number)[], key: string | number): boolean {
    for (const value of values) if (value === key) return true;
    return false;
}
