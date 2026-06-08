import type { TumblerIdx } from "./TumblerIdx";

/** Packed snapshot is an array of tumbler positions, packed into a single
 * integer.
 * Can be used as a hash, or as a compact representation of the state */
export type PackedSnapshot = number & {
	readonly [PackedSnapshotBrand]: typeof PackedSnapshotBrand;
};
declare const PackedSnapshotBrand: unique symbol;

export interface SnapshotPackerParams {
	nTumblers: number;
	tumblerWidth: number;
}

export class SnapshotPacker {
	readonly nTumblers: number;
	readonly tumblerWidth: number;
	constructor(params: SnapshotPackerParams) {
		this.nTumblers = params.nTumblers;
		this.tumblerWidth = params.tumblerWidth;
	}

	/** Generates a unique hashable key for any tumbler snapshot. */
	pack(s: TumblerIdx[]): PackedSnapshot {
		let k = 0;
		for (let i = this.nTumblers - 1; i >= 0; i--) {
			k = k * this.tumblerWidth + s[i];
		}
		return k as PackedSnapshot;
	}

	/** Restores key back to state */
	unpack(packedSnapshot: PackedSnapshot): TumblerIdx[] {
		let k: number = packedSnapshot;
		const s = new Array(this.nTumblers);
		for (let i = 0; i < this.nTumblers; i++) {
			s[i] = k % this.tumblerWidth;
			k = Math.floor(k / this.tumblerWidth);
		}
		return s;
	}
}
