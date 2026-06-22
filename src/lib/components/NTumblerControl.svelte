<script lang="ts">
	interface Props {
		value: number;
	}
	let { value = $bindable() }: Props = $props();

	const min = 5;
	const max = 7;
</script>

<div class="n-tumblers">
	<button type="button" class="n-tumblers__btn" disabled={value <= min} onclick={() => value--}>
		-
	</button>
	<!-- We're setting this input to the height of "pin", so both tumblers 
      and dep cells are aligned on desktop -->
	<label class="n-tumblers__label">
		Number of tumblers
		<input
			class="n-tumblers__input"
			type="number"
			{min}
			{max}
			step="1"
			{value}
			onchange={(e) => {
				const val = Math.min(Math.max(e.currentTarget.valueAsNumber, min), max);
				value = val;
			}}
		/>
	</label>
	<button type="button" class="n-tumblers__btn" disabled={value >= max} onclick={() => value++}>
		+
	</button>
</div>

<style>
	.n-tumblers {
		display: flex;
		height: var(--pin-size);
		align-items: center;
		gap: 0.2em;
	}
	.n-tumblers__input {
		max-height: var(--pin-size);
	}
	.n-tumblers__btn {
		height: calc(var(--pin-size) * 0.9);
		width: calc(var(--pin-size) * 0.9);
		padding: 0;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
	}
</style>
