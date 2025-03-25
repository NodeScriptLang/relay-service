export function calculateMillicredits(cost: number, pricePerCredit: number): number {
    if (cost === 0 || pricePerCredit === 0) {
        return 0;
    }
    const millicredits = (cost / Number(pricePerCredit)) * 1000;
    return Math.ceil(millicredits);
}
