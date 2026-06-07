<script lang="ts">
	import { DirectionEnum } from "$lib/models/DirectionEnum";
	import { FAILED_TUMBLER_MOVE_EVENT_NAME } from "$lib/models/FailedMoveEvent";
	import type { Field } from "$lib/models/Field.svelte";
	import { Move } from "$lib/models/Move";

	interface Props {
		field: Field;
		lockViewEl: HTMLUListElement | undefined;
	}
	let { field, lockViewEl }: Props = $props();

	function dispatchFailedUpdatesEvent(failedIndexes: number[]): void {
		if (!failedIndexes?.length) {
			return;
		}
		const event = new CustomEvent(FAILED_TUMBLER_MOVE_EVENT_NAME, {
			detail: {
				indexes: failedIndexes,
			},
		});
		document.dispatchEvent(event);
	}
</script>

<svelte:document
	onkeydown={(e) => {
		// preventing tumblers moving on input to the header and such --
		// not processing click events by early return
		if (
			document.activeElement !== document.body &&
			document.activeElement !== lockViewEl &&
			!lockViewEl?.contains(document.activeElement)
		) {
			return;
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
				const failed = field.moveTumbler(new Move(field.selectedTumblerIdx, DirectionEnum.Left));
				dispatchFailedUpdatesEvent(failed);
				break;
			}
			case "ArrowRight":
			case "d":
			case "l": {
				const failed = field.moveTumbler(new Move(field.selectedTumblerIdx, DirectionEnum.Right));
				dispatchFailedUpdatesEvent(failed);
				break;
			}
		}
	}}
/>
