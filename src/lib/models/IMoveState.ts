import type { Move } from "./Move";
import type { PackedSnapshot } from "./SnapshotPacker";

/** Move command, with the resulting state of the command application for
 * undo-redo list */
export interface IMoveState {
	move: Move;
	state: PackedSnapshot;
}
