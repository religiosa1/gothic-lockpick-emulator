import type { TumblerIdx } from "$lib/models/TumblerIdx";

export const FAILED_TUMBLER_MOVE_EVENT_NAME = "failed-tumbler-move";

export interface FailedTumblerMoveEventDetail {
	indexes: TumblerIdx[];
}

export function dispatchFailedMoveEvent(failedIndexes: TumblerIdx[]): void {
	const event = new CustomEvent(FAILED_TUMBLER_MOVE_EVENT_NAME, {
		detail: {
			indexes: failedIndexes,
		},
	});
	document.dispatchEvent(event);
}

declare global {
	interface DocumentEventMap {
		[FAILED_TUMBLER_MOVE_EVENT_NAME]: CustomEvent<FailedTumblerMoveEventDetail>;
	}
}
