import type { Move } from "./Move";

export const MOVE_REQUESTED_EVENT = "move-requested-event";

declare global {
	interface DocumentEventMap {
		[MOVE_REQUESTED_EVENT]: CustomEvent<Move>;
	}
}
