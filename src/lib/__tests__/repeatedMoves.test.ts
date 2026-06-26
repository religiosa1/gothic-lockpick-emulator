import { describe, it, expect } from "vitest";
import { Move } from "../models/Move";
import { DirectionEnum } from "../models/enums/DirectionEnum";
import { findRepeatedMoves } from "../repeatedMoves";

const L = (idx: number) => new Move(idx, DirectionEnum.Left);
const R = (idx: number) => new Move(idx, DirectionEnum.Right);

describe("findRepeatedMoves", () => {
	it("returns no groups for short or empty input", () => {
		expect(findRepeatedMoves([]).groupCount).toBe(0);
		expect(findRepeatedMoves([L(0)]).groups).toEqual([null]);
	});

	it("does not color non-repeating sequences", () => {
		const { groups, groupCount } = findRepeatedMoves([L(0), R(1), L(2), R(3)]);
		expect(groupCount).toBe(0);
		expect(groups).toEqual([null, null, null, null]);
	});

	it("colors a 3-move block repeated 3 times with one shared group", () => {
		// [A B C] x3 ; saved = 3 * (3-1) = 6 >= 4
		const block = [L(0), R(1), L(2)];
		const moves = [...block, ...block, ...block];
		const { groups, groupCount } = findRepeatedMoves(moves);

		expect(groupCount).toBe(1);
		// every position colored, all the same group id
		expect(groups.every((g) => g === 0)).toBe(true);
	});

	it("respects the minSaved threshold", () => {
		// [A B] x2 only: saved = 2 * (2-1) = 2 < 4 -> not colored
		const moves = [L(0), R(1), L(0), R(1)];
		expect(findRepeatedMoves(moves).groupCount).toBe(0);
		// lower the bar -> colored
		expect(findRepeatedMoves(moves, { minSaved: 2 }).groupCount).toBe(1);
	});

	it("distinguishes two different repeated patterns", () => {
		const p = [L(0), R(0), L(0)]; // x3 -> saved 3*(3-1)=6
		const q = [R(5), L(5), R(5)];
		const moves = [...p, ...p, ...p, ...q, ...q, ...q];
		const { groups, groupCount } = findRepeatedMoves(moves);

		expect(groupCount).toBe(2);
		// the two halves carry different, internally-consistent group ids
		const first = new Set(groups.slice(0, 9));
		const second = new Set(groups.slice(9));
		expect(first.size).toBe(1);
		expect(second.size).toBe(1);
		expect([...first][0]).not.toBe([...second][0]);
	});
});
