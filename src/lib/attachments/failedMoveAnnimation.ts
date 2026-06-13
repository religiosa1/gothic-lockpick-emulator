import type { TumblerIdx } from "$lib/models/TumblerIdx";

class Delayer {
	#to: ReturnType<typeof setTimeout> | null = null;

	constructor(ac: AbortSignal) {
		ac.addEventListener("abort", () => this.disarm());
	}

	arm(cb: () => void, delay: number) {
		this.disarm();
		this.#to = setTimeout(() => {
			this.#to = null;
			cb();
		}, delay);
	}

	disarm() {
		if (this.#to != null) {
			clearTimeout(this.#to);
		}
	}
}

interface FailedMoveAnimationProps {
	duration?: number;
	className?: string;
}

export function failedMoveAnimation(
	idx: TumblerIdx,
	{ duration = 1000, className = "failed-move" }: FailedMoveAnimationProps = {}
) {
	return (el: HTMLElement) => {
		const ac = new AbortController();
		const delayer = new Delayer(ac.signal);

		document.addEventListener(
			"failed-tumbler-move",
			(e) => {
				if (!e.detail.indexes.includes(idx)) {
					return;
				}
				el.classList.add(className);
				delayer.arm(() => el.classList.remove(className), duration);
			},
			{ signal: ac.signal }
		);
		return () => ac.abort();
	};
}
