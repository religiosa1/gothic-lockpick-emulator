import type { TumblerIdx } from "$lib/models/TumblerIdx";
import { Move } from "$lib/models/Move";
import { MOVE_REQUESTED_EVENT } from "$lib/models/MoveRequestedEvent";
import { DirectionEnum } from "$lib/models/DirectionEnum";

export function tumblerMouseDragAttachment(idx: TumblerIdx) {
	function dispatchMove(direction: DirectionEnum) {
		document.dispatchEvent(
			new CustomEvent(MOVE_REQUESTED_EVENT, { detail: new Move(idx, direction) })
		);
	}

	return (el: HTMLElement) => {
		const ac = new AbortController();

		let hasDragged = false;
		el.addEventListener(
			"click",
			() => {
				if (hasDragged) {
					hasDragged = false;
					return;
				}
				dispatchMove(DirectionEnum.Right);
			},
			{ signal: ac.signal }
		);

		let startX = 0;
		let startY = 0;
		let lastStepX = 0;
		let isDragging = false;
		let pinSize = 0;

		el.addEventListener(
			"pointerdown",
			(e) => {
				if (e.button !== 0) return;
				startX = e.clientX;
				startY = e.clientY;
				lastStepX = e.clientX;
				isDragging = true;
				hasDragged = false;
				pinSize = el.querySelector(".pin")?.getBoundingClientRect().width ?? 22;
				el.setPointerCapture(e.pointerId);
			},
			{ signal: ac.signal }
		);

		el.addEventListener(
			"pointermove",
			(e) => {
				if (!isDragging) return;
				const totalDeltaX = e.clientX - startX;
				const totalDeltaY = e.clientY - startY;
				if (Math.abs(totalDeltaX) <= Math.abs(totalDeltaY)) return;

				const stepDelta = e.clientX - lastStepX;
				const steps = Math.floor(Math.abs(stepDelta) / pinSize);
				if (steps === 0) return;

				const direction = stepDelta < 0 ? DirectionEnum.Left : DirectionEnum.Right;
				for (let i = 0; i < steps; i++) {
					dispatchMove(direction);
				}
				lastStepX += steps * pinSize * Math.sign(stepDelta);
				hasDragged = true;
			},
			{ signal: ac.signal }
		);

		const endDrag = () => {
			isDragging = false;
		};
		el.addEventListener("pointerup", endDrag, { signal: ac.signal });
		el.addEventListener("pointercancel", endDrag, { signal: ac.signal });

		return () => ac.abort();
	};
}
