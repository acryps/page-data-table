import { RenderedCell } from "./cell";

export class RenderedRow {
	constructor(
		public source: HTMLElement,
		public cells: RenderedCell[]
	) {}
}