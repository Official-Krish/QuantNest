import { cn } from "@/lib/utils";

export type AppBackgroundVariant = "default" | "warm" | "vivid";
export type AppBackgroundGlow = "none" | "soft" | "medium";

type AppBackgroundProps = {
	className?: string;
	variant?: AppBackgroundVariant;
	glow?: AppBackgroundGlow;
	gridSize?: number;
	noise?: boolean;
};

const ORB_STYLES: Record<AppBackgroundVariant, string[]> = {
	default: [
		"absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f17463]/18 blur-3xl",
		"absolute -right-20 top-32 h-80 w-80 rounded-full bg-[#f4937d]/14 blur-3xl",
		"absolute -bottom-30 left-1/3 h-72 w-72 rounded-full bg-[#7dd3fc]/10 blur-3xl",
	],
	warm: [
		"absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f17463]/20 blur-3xl",
		"absolute -right-20 top-32 h-80 w-80 rounded-full bg-[#f4937d]/16 blur-3xl",
		"absolute -bottom-30 left-1/3 h-72 w-72 rounded-full bg-[#fde1d6]/12 blur-3xl",
	],
	vivid: [
		"absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#f17463]/16 blur-3xl",
		"absolute -right-20 top-28 h-80 w-80 rounded-full bg-[#a78bfa]/14 blur-3xl",
		"absolute -bottom-30 left-1/3 h-72 w-72 rounded-full bg-[#38bdf8]/10 blur-3xl",
	],
};

const GLOW_OVERLAY: Record<AppBackgroundGlow, string> = {
	none: "opacity-0",
	soft: "opacity-60",
	medium: "opacity-100",
};

export function AppBackground({
	className,
	variant = "default",
	glow = "soft",
	gridSize = 42,
	noise = true,
}: AppBackgroundProps) {
	const fineGridSize = gridSize / 3;

	return (
		<div
			aria-hidden
			className={cn(
				"pointer-events-none absolute inset-0 overflow-hidden",
				className,
			)}
		>
			{/* Orbs */}
			{ORB_STYLES[variant].map((orbClassName, idx) => (
				<div key={idx} className={orbClassName} />
			))}

			{/* Radial glow overlay */}
			<div
				className={cn(
					"absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%)]",
					GLOW_OVERLAY[glow],
				)}
			/>

			{/* Fine sub-grid — subtle inner texture */}
			<div className="absolute inset-0 opacity-[0.025] mask-[radial-gradient(ellipse_at_center,black_40%,transparent_85%)]">
				<div
					className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
					style={{ backgroundSize: `${fineGridSize}px ${fineGridSize}px` }}
				/>
			</div>

			{/* Primary grid — main structural lines */}
			<div className="absolute inset-0 opacity-[0.22] mask-[radial-gradient(ellipse_at_center,black_55%,transparent_100%)]">
				<div
					className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)]"
					style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
				/>
			</div>

			{/* Dot matrix at grid intersections */}
			<div className="absolute inset-0 opacity-[0.18] mask-[radial-gradient(ellipse_at_center,black_50%,transparent_90%)]">
				<div
					className="h-full w-full bg-[radial-gradient(circle,rgba(255,255,255,0.55)_0.8px,transparent_0.8px)]"
					style={{ backgroundSize: `${gridSize}px ${gridSize}px` }}
				/>
			</div>

			{/* Diagonal accent lines — top-left sweep */}
			<div
				className="absolute inset-0 opacity-[0.04]"
				style={{
					backgroundImage: `repeating-linear-gradient(
						-45deg,
						rgba(255,255,255,0.15) 0px,
						rgba(255,255,255,0.15) 1px,
						transparent 1px,
						transparent ${gridSize * 2}px
					)`,
				}}
			/>

			{/* Corner vignette anchors */}
			<div className="absolute inset-0">
				{/* Top-left */}
				<div className="absolute top-0 left-0 h-48 w-48 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.04),transparent_70%)]" />
				{/* Bottom-right */}
				<div className="absolute bottom-0 right-0 h-64 w-64 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.04),transparent_70%)]" />
			</div>

			{/* Edge fade — softens grid at borders */}
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_center,transparent_60%,rgba(0,0,0,0.35)_100%)]" />

			{/* Noise texture */}
			{noise && (
				<div className="absolute inset-0 opacity-[0.04] mix-blend-soft-light bg-[radial-gradient(rgba(255,255,255,0.6)_0.5px,transparent_0.5px)] bg-size-[3px_3px]" />
			)}
		</div>
	);
}