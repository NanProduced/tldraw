import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement> & {
	className?: string
}

export function ChevronRightIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="12"
			height="12"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M6 4L10 8L6 12"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function EyeOpenIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.25" />
			<path
				d="M14.5 8C13.8312 5.3343 11.1523 3 8 3C4.84772 3 2.16881 5.3343 1.5 8C2.16881 10.6657 4.84772 13 8 13C11.1523 13 13.8312 10.6657 14.5 8Z"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function EyeCloseIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M2 2L14 14"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
			/>
			<path
				d="M10.7976 11.5398C9.99393 12.1366 9.03418 12.5 8 12.5C4.84772 12.5 2.16881 10.1657 1.5 7.5C1.81649 6.30611 2.52246 5.26563 3.48568 4.5M5.10137 5.12518C5.9476 4.54861 6.93993 4.25 8 4.25C11.1523 4.25 13.8312 6.5843 14.5 9.25C14.333 9.8854 14.0747 10.4818 13.7422 11.0312"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M7.5 8.75C6.80964 8.75 6.25 8.19036 6.25 7.5C6.25 7.08634 6.44754 6.72181 6.74169 6.47084M8.25831 8.52916C8.55246 8.27819 8.75 7.91366 8.75 7.5C8.75 6.80964 8.19036 6.25 7.5 6.25"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function LockOpenIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M5 7V6C5 4.34315 6.34315 3 8 3C9.65685 3 11 4.34315 11 6"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<rect
				x="4"
				y="7"
				width="8"
				height="5.5"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function LockCloseIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M5 7V6C5 4.34315 6.34315 3 8 3C9.65685 3 11 4.34315 11 6V7"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<rect
				x="4"
				y="7"
				width="8"
				height="5.5"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M8 9.25C8.27614 9.25 8.5 9.47386 8.5 9.75C8.5 10.0261 8.27614 10.25 8 10.25C7.72386 10.25 7.5 10.0261 7.5 9.75C7.5 9.47386 7.72386 9.25 8 9.25Z"
				fill="currentColor"
			/>
		</svg>
	)
}

export function TrashIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M2 4.5H14"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
			/>
			<path
				d="M5.5 3.5C5.5 2.94772 5.94772 2.5 6.5 2.5H9.5C10.0523 2.5 10.5 2.94772 10.5 3.5V4.5H5.5V3.5Z"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M12.5 4.5L12.0845 12.3089C12.0387 13.1726 11.3173 13.85 10.4521 13.85H5.5479C4.6827 13.85 3.96131 13.1726 3.91554 12.3089L3.5 4.5"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function TextIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M3 4H13"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
			/>
			<path
				d="M5 4V11.5C5 11.7761 4.77614 12 4.5 12C4.22386 12 4 11.7761 4 11.5V4"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M11 4V11.5C11 11.7761 11.2239 12 11.5 12C11.7761 12 12 11.7761 12 11.5V4"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function GeoIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="3"
				y="3"
				width="10"
				height="10"
				rx="1.5"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function ArrowIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M3 8H10.5M10.5 8L7.5 5M10.5 8L7.5 11"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="12.5" cy="8" r="0.75" fill="currentColor" />
		</svg>
	)
}

export function FrameIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="2.5"
				y="2.5"
				width="11"
				height="11"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeDasharray="2 2"
			/>
		</svg>
	)
}

export function GroupIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="2"
				y="5"
				width="5"
				height="6"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<rect
				x="9"
				y="5"
				width="5"
				height="6"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<path
				d="M7 8H9"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
			/>
		</svg>
	)
}

export function ImageIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="2.5"
				y="3.5"
				width="11"
				height="9"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<path
				d="M2.5 10.5L5 8L7 9.5L9.5 6.5L13.5 10.5"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="10.5" cy="6" r="1" stroke="currentColor" strokeWidth="1.25" />
		</svg>
	)
}

export function DrawIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M3 12.5C3 12.5 5 10.5 7 11C9 11.5 8 9.5 10 8C12 6.5 13.5 5 13.5 5"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="13.5" cy="4.5" r="0.75" fill="currentColor" />
		</svg>
	)
}

export function NoteIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="2.5"
				y="2.5"
				width="8"
				height="11"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<path
				d="M10.5 2.5L13.5 5.5V12.5C13.5 13.0523 13.0523 13.5 12.5 13.5H10.5V2.5Z"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M10.5 5.5H12.5C13.0523 5.5 13.5 5.05228 13.5 4.5V5.5H10.5Z"
				fill="currentColor"
				opacity="0.2"
			/>
		</svg>
	)
}

export function VideoIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="2.5"
				y="4.5"
				width="8"
				height="7"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<path
				d="M10.5 7L13.5 5V11L10.5 9"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M6.5 6.5L8.5 8L6.5 9.5V6.5Z"
				fill="currentColor"
			/>
		</svg>
	)
}

export function BookmarkIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M4 3.5C4 2.94772 4.44772 2.5 5 2.5H11C11.5523 2.5 12 2.94772 12 3.5V13.5L8 10.5L4 13.5V3.5Z"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function EmbedIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<rect
				x="2.5"
				y="4.5"
				width="11"
				height="7"
				rx="1"
				stroke="currentColor"
				strokeWidth="1.25"
			/>
			<path
				d="M6.5 7.5L8.5 8.5L10.5 7.5"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function HighlightIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M9.5 2.5L13.5 6.5L7 13L5 11L3 9L9.5 2.5Z"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M3 9L1.5 14.5L6 13"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export function LineIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M3 13L5 10L7 11L13 3"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="3" cy="13" r="0.75" fill="currentColor" />
			<circle cx="13" cy="3" r="0.75" fill="currentColor" />
		</svg>
	)
}

export function LayersIcon({ className, ...props }: IconProps) {
	return (
		<svg
			viewBox="0 0 16 16"
			width="14"
			height="14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			{...props}
		>
			<path
				d="M8 2.5L13.5 5.5L8 8.5L2.5 5.5L8 2.5Z"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2.5 9L8 12L13.5 9"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M2.5 12L8 15L13.5 12"
				stroke="currentColor"
				strokeWidth="1.25"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
