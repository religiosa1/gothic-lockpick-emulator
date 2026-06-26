<script lang="ts">
	import { DirectionEnum, directionToString } from "$lib/models/enums/DirectionEnum";
	import type { Move } from "$lib/models/Move";
	import { idxToChar } from "$lib/models/TumblerIdx";

	interface Props {
		move: Move;
	}

	let { move }: Props = $props();
</script>

<span class="move">
	Move(<span class="move__idx">
		{idxToChar(move.idx)},
	</span>
	<span
		class="mode__direction"
		class:right={move.direction === DirectionEnum.Right}
		class:left={move.direction === DirectionEnum.Left}
	>
		{directionToString(move.direction)}
	</span>)
</span>

<style>
	.right {
		color: var(--clr-pos);
	}
	.left {
		color: var(--clr-neg);
	}
</style>
