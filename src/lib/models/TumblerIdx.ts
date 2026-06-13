export type TumblerIdx = number;

export function idxToChar(n: TumblerIdx): string {
	let result = "";
	n += 1; // shift to 1-indexed
	while (n > 0) {
		n -= 1;
		result = String.fromCharCode(65 + (n % 26)) + result;
		n = Math.floor(n / 26);
	}
	return result;
}
