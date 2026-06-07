import { DirectionEnum, reverseDirection } from "./models/DirectionEnum";
import { Move } from "./models/Move";
import { SnapshotPacker, type PackedSnapshot } from "./models/SnapshotPacker";
import type { TumblerIdx } from "./models/TumblerIdx";

interface SolverParams {
	nTumblers: number;
	tumblerWidth: number;
	dependencies: number[][];
	tumblerRow: number;
}

/** Move command, with the resulting state of the command application for
 * undo-redo list */
export interface MoveState {
	move: Move;
	state: PackedSnapshot;
}

export class Solver {
	private readonly packer: SnapshotPacker;
	private readonly nTumblers: number;
	private readonly tumblerWidth: number;
	private readonly dependencies: number[][];
	private readonly goal: TumblerIdx[];
	/** Distance to solution from a possible state to solution in number of moves required */
	private readonly distancesMap = new Map<PackedSnapshot, number>();
	/** Next best move towards the goal */
	private readonly nextStepsMap = new Map<PackedSnapshot, Move>();

	constructor(cfg: SolverParams) {
		this.packer = new SnapshotPacker({
			tumblerWidth: cfg.tumblerWidth,
			nTumblers: cfg.nTumblers,
		});
		this.nTumblers = cfg.nTumblers;
		this.tumblerWidth = cfg.tumblerWidth;
		this.dependencies = cfg.dependencies.map((r) => r.slice());
		this.goal = new Array(cfg.nTumblers).fill(cfg.tumblerRow);
		this.build();
	}

	isSolvable(snapshot: TumblerIdx[]): boolean {
		return this.distancesMap.has(this.packer.pack(snapshot));
	}

	/** get optimal (fewest-move) sequence to solve, or null if unsolvable. */
	solve(snapshot: TumblerIdx[]): MoveState[] | undefined {
		let k = this.packer.pack(snapshot);
		if (!this.distancesMap.has(k)) {
			return undefined;
		}

		let s = snapshot.slice();
		const movesStates: MoveState[] = [];
		while (this.distancesMap.get(k)! > 0) {
			const m = this.nextStepsMap.get(k)!;
			movesStates.push({ move: m, state: k });
			s = this.apply(s, m)!;
			k = this.packer.pack(s);
		}
		return movesStates;
	}

	/** Amount of potential net steps stored */
	get size(): number {
		return this.nextStepsMap.size;
	}

	/** Optimal next move from any node */
	hint(state: number[]): Move | undefined {
		const k = this.packer.pack(state);
		const distance = this.distancesMap.get(k);
		if (distance == null || distance === 0) {
			return undefined;
		}
		const next = this.nextStepsMap.get(k);
		if (!next) {
			throw new Error("Unexpected missing next step, when a distance to solve is known");
		}
		return next;
	}

	/** Basically the same as Field.move(), but without the extended error checks */
	private apply(snapshot: TumblerIdx[], move: Move): TumblerIdx[] | undefined {
		const dependencies = this.dependencies[move.idx];
		const outSnapshot = snapshot.slice();

		for (let idx = 0; idx < this.nTumblers; idx++) {
			const oldValue = snapshot[idx];
			const delta = idx === move.idx ? move.direction : dependencies[idx] * move.direction;
			const tumblerValue = oldValue + delta;
			if (tumblerValue < 0 || tumblerValue >= this.tumblerWidth) {
				return undefined;
			}
			outSnapshot[idx] = tumblerValue;
		}
		return outSnapshot;
	}

	// One backward BFS from the goal. Graph is undirected, so this labels every
	// solvable state with its distance and the optimal next move toward the goal.
	private build() {
		const q: TumblerIdx[][] = [this.goal];
		this.distancesMap.set(this.packer.pack(this.goal), 0);
		for (let h = 0; h < q.length; h++) {
			const s = q[h];
			const ds = this.distancesMap.get(this.packer.pack(s))!;
			for (let idx = 0; idx < this.nTumblers; idx++) {
				for (const dir of [DirectionEnum.Left, DirectionEnum.Right]) {
					const t = this.apply(s, new Move(idx, dir));
					if (!t) {
						continue;
					}
					const kt = this.packer.pack(t);
					if (this.distancesMap.has(kt)) {
						continue;
					}
					this.distancesMap.set(kt, ds + 1);
					const toward = reverseDirection(dir);
					this.nextStepsMap.set(kt, new Move(idx, toward));
					q.push(t);
				}
			}
		}
	}
}
