export const DirectionEnum = {
	Left: 1,
	Right: -1,
} as const;
export type DirectionEnum = (typeof DirectionEnum)[keyof typeof DirectionEnum];

export function directionToString(dir: DirectionEnum): "left" | "right" {
	switch (dir) {
		case DirectionEnum.Left:
			return "left";
		case DirectionEnum.Right:
			return "right";
		default:
			throw new Error(`Unknown direction value: ${dir}`);
	}
}
