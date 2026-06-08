import { describe, it, expect } from "vitest";
import type { TumblerIdx } from "../TumblerIdx";
import { SnapshotPacker, type SnapshotPackerParams } from "../SnapshotPacker";

describe("SnapshotPacker", () => {
	// width of inner array dictates the tumbler width
	const snapshots: Array<TumblerIdx[]> = [
		[0, 1, 2, 3, 4],
		[1, 1, 1, 1, 1],
		[0, 0, 0, 0, 0],
		[3, 2, 1, 6, 6],
	];
	const packerParams: SnapshotPackerParams = {
		tumblerWidth: 7,
		nTumblers: 5,
	};

	it("same snapshot states must result in the same value", () => {
		const packer = new SnapshotPacker(packerParams);
		for (const snapshot of snapshots) {
			const a = packer.pack(snapshot);
			const b = packer.pack(snapshot);
			expect(a).toBe(b);
		}
	});

	it("different snapshots must have different values", () => {
		const packer = new SnapshotPacker(packerParams);
		const set = new Set(snapshots.map((s) => packer.pack(s)));
		expect(set.size).toBe(snapshots.length);
	});

	it("packed snapshot can be reversed back with unpack", () => {
		const packer = new SnapshotPacker(packerParams);
		for (const snapshot of snapshots) {
			const packed = packer.pack(snapshot);
			const unpacked = packer.unpack(packed);
			expect(unpacked).toEqual(snapshot);
		}
	});
});
