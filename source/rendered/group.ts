import { RenderedRow } from "./row";

export class RenderedGroup {
	constructor(
		public source: HTMLElement,
		public rows: RenderedRow[]
	) {}
}