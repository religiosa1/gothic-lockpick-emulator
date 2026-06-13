<script lang="ts">
	import { DirectionEnum } from "$lib/models/enums/DirectionEnum";
	import type { Field } from "$lib/models/Field.svelte";
	import { Move } from "$lib/models/Move";
	import { dispatchMoveRequestEvent } from "$lib/models/events/MoveRequestedEvent";

	interface Props {
		field: Field;
		/** Focus should be either on the body, or on this specific elements */
		lockViewEl: HTMLElement | undefined;
	}
	let { field, lockViewEl }: Props = $props();
</script>

<svelte:document
	onkeydown={(e) => {
		{
			// preventing tumblers moving on input to the header and such --
			// not processing click events by early return
			const actEl = document.activeElement;
			const isSomeElementFocused = actEl !== document.body;
			const isFocusWithinLockView = actEl === lockViewEl || lockViewEl?.contains(actEl);
			if (isSomeElementFocused && !isFocusWithinLockView) {
				return;
			}
		}
		switch (e.key) {
			case "ArrowUp":
			case "w":
			case "k": {
				field.selectPrevTumbler();
				break;
			}
			case "ArrowDown":
			case "s":
			case "j": {
				field.selectNextTumbler();
				break;
			}
			case "ArrowLeft":
			case "a":
			case "h": {
				dispatchMoveRequestEvent(new Move(field.selectedTumblerIdx, DirectionEnum.Left));
				break;
			}
			case "ArrowRight":
			case "d":
			case "l": {
				dispatchMoveRequestEvent(new Move(field.selectedTumblerIdx, DirectionEnum.Right));
				break;
			}
		}
	}}
/>
