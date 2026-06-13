import type { Move } from "$lib/models/Move";

export const MOVE_REQUESTED_EVENT = "move-requested-event";

export function dispatchMoveRequestEvent(move: Move): void {
	const event = new CustomEvent(MOVE_REQUESTED_EVENT, {
		detail: move,
	});
	document.dispatchEvent(event);
}

declare global {
	interface DocumentEventMap {
		[MOVE_REQUESTED_EVENT]: CustomEvent<Move>;
	}
}
