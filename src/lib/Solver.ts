import { DirectionEnum, reverseDirection } from "./models/DirectionEnum";
import { Move } from "./models/Move";
import type { IMoveState } from "./models/IMoveState";
import { SnapshotPacker, type PackedSnapshot } from "./models/SnapshotPacker";
import type { TumblerIdx } from "./models/TumblerIdx";

interface SolverParams {
	nTumblers: number;
	tumblerWidth: number;
	dependencies: number[][];
	tumblerRow: number;
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

	private isBuilt = false;

	constructor(cfg: SolverParams) {
		this.packer = new SnapshotPacker({
			tumblerWidth: cfg.tumblerWidth,
			nTumblers: cfg.nTumblers,
		});
		this.nTumblers = cfg.nTumblers;
		this.tumblerWidth = cfg.tumblerWidth;
		this.dependencies = cfg.dependencies.map((r) => r.slice());
		this.goal = new Array(cfg.nTumblers).fill(cfg.tumblerRow);
	}

	// One backward BFS from the goal. Graph is undirected, so this labels every
	// solvable state with its distance and the optimal next move toward the goal.
	async build(): Promise<void> {
		const yieldToMain = () =>
			globalThis.scheduler?.yield?.() ?? new Promise((r) => setTimeout(r, 0));

		// time budget before yielding back to scheduler
		let deadline = performance.now() + 50;

		// ever-growing queue to avoid costly shifts, headIdx points to the item being processed
		const queue: Array<TumblerIdx[]> = [this.goal];
		this.distancesMap.set(this.packer.pack(this.goal), 0);
		for (let headIdx = 0; headIdx < queue.length; headIdx++) {
			const headSnapshot = queue[headIdx];
			const distance = this.distancesMap.get(this.packer.pack(headSnapshot));
			if (distance == null) {
				throw new Error("Unexpected empty distance for a just processed item");
			}
			for (let tumblerIdx = 0; tumblerIdx < this.nTumblers; tumblerIdx++) {
				// scheduler.yield shenanigans cost us more than  twice the execution
				// time, but at least we're not blocking the main thread; 300ms -> 700ms
				if (performance.now() > deadline) {
					await yieldToMain();
					deadline = performance.now() + 50;
				}
				for (const direction of [DirectionEnum.Left, DirectionEnum.Right]) {
					const neighbor = this.apply(headSnapshot, new Move(tumblerIdx, direction));
					if (!neighbor) {
						continue;
					}
					const neighborKey = this.packer.pack(neighbor);
					if (this.distancesMap.has(neighborKey)) {
						continue;
					}
					this.distancesMap.set(neighborKey, distance + 1);
					const towardGoal = reverseDirection(direction);
					this.nextStepsMap.set(neighborKey, new Move(tumblerIdx, towardGoal));
					queue.push(neighbor);
				}
			}
		}
		this.isBuilt = true;
	}

	isSolvable(snapshot: TumblerIdx[]): boolean {
		if (!this.isBuilt) {
			throw new Error("build method must be called first, to build a map of solutions");
		}
		return this.distancesMap.has(this.packer.pack(snapshot));
	}

	/** get optimal (fewest-move) sequence to solve, or null if unsolvable. */
	solve(snapshot: TumblerIdx[]): IMoveState[] | undefined {
		if (!this.isBuilt) {
			throw new Error("build method must be called first, to build a map of solutions");
		}
		let k = this.packer.pack(snapshot);
		if (!this.distancesMap.has(k)) {
			return undefined;
		}

		let s = snapshot.slice();
		const movesStates: IMoveState[] = [];
		while (this.distancesMap.get(k)! > 0) {
			const m = this.nextStepsMap.get(k)!;
			s = this.apply(s, m)!;
			k = this.packer.pack(s);
			movesStates.push({ move: m, state: k });
		}
		return movesStates;
	}

	/** Amount of potential net steps stored */
	get size(): number {
		return this.nextStepsMap.size;
	}

	/** Optimal next move from any node */
	hint(state: number[]): Move | undefined {
		if (!this.isBuilt) {
			throw new Error("build method must be called first, to build a map of solutions");
		}
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
}
