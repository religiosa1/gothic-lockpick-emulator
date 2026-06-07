import { DirectionEnum } from "./models/DirectionEnum";
import { Move } from "./models/Move";
import type { TumblerIdx } from "./models/TumblerIdx";

interface SolverParams {
	nTumblers: number;
	tumblerWidth: number;
	dependencies: number[][];
	tumblerRow: number;
}

/** State representation in a single integer */
type SnapshotKey = number;

export class Solver {
	private nTumblers: number;
	private tumblerWidth: number;
	private dependencies: number[][];
	private goal: TumblerIdx[];
	/** Distance to solution from a possible state to solution in number of moves required */
	private distance = new Map<SnapshotKey, number>();
	private next = new Map<SnapshotKey, Move>();

	constructor(cfg: SolverParams) {
		this.nTumblers = cfg.nTumblers;
		this.tumblerWidth = cfg.tumblerWidth;
		this.dependencies = cfg.dependencies.map((r) => r.slice());
		this.goal = new Array(cfg.nTumblers).fill(cfg.tumblerRow);
		this.build();
	}

	isSolvable(snapshot: TumblerIdx[]): boolean {
		return this.distance.has(this.encodeKey(snapshot));
	}

	/** get optimal (fewest-move) sequence to solve, or null if unsolvable. */
	solve(snapshot: TumblerIdx[]): Move[] | null {
		let k = this.encodeKey(snapshot);
		if (!this.distance.has(k)) {
			return null;
		}

		let s = snapshot.slice();
		const moves: Move[] = [];
		while (this.distance.get(k)! > 0) {
			const m = this.next.get(k)!;
			moves.push(m);
			s = this.apply(s, m)!;
			k = this.encodeKey(s);
		}
		return moves;
	}

	/** Optimal next move from any node */
	hint(state: number[]): Move | null {
		const k = this.encodeKey(state);
		return this.distance.get(k) ? this.next.get(k)! : null;
	}

	/** Generates a unique hashable key for any tumbler snapshot. */
	private encodeKey(s: TumblerIdx[]): number {
		let k = 0;
		for (let i = this.nTumblers - 1; i >= 0; i--) {
			k = k * this.tumblerWidth + s[i];
		}
		return k;
	}

	/** Restores key back to state */
	// private decodeSnapshotFromKey(k: number): number[] {
	// 	const s = new Array(this.nTumblers);
	// 	for (let i = 0; i < this.nTumblers; i++) {
	// 		s[i] = k % this.tumblerWidth;
	// 		k = Math.floor(k / this.tumblerWidth);
	// 	}
	// 	return s;
	// }

	// TODO: deduplicate this logic somehow?
	// Pure mirror of Field.moveTumbler's math + bounds. null = blocked (non-edge).
	private apply(snapshot: TumblerIdx[], move: Move): number[] | null {
		const d = this.dependencies[move.idx];
		const out = snapshot.slice();
		for (let i = 0; i < this.nTumblers; i++) {
			out[i] = snapshot[i] + (i === move.idx ? move.direction : d[i] * move.direction);
			if (out[i] < 0 || out[i] >= this.tumblerWidth) {
				return null;
			}
		}
		return out;
	}

	// One backward BFS from the goal. Graph is undirected, so this labels every
	// solvable state with its distance and the optimal next move toward the goal.
	private build() {
		const q: number[][] = [this.goal];
		this.distance.set(this.encodeKey(this.goal), 0);
		for (let h = 0; h < q.length; h++) {
			const s = q[h];
			const ds = this.distance.get(this.encodeKey(s))!;
			for (let idx = 0; idx < this.nTumblers; idx++) {
				for (const dir of [DirectionEnum.Left, DirectionEnum.Right]) {
					const t = this.apply(s, new Move(idx, dir));
					if (!t) continue;
					const kt = this.encodeKey(t);
					if (this.distance.has(kt)) continue;
					this.distance.set(kt, ds + 1);
					const toward = dir === DirectionEnum.Left ? DirectionEnum.Right : DirectionEnum.Left;
					this.next.set(kt, new Move(idx, toward));
					q.push(t);
				}
			}
		}
	}
}
