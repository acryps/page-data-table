export class DataTableGroup<RowType> {
	constructor(
		public header: any | null,
		public content: RowType[] | DataTableGroup<RowType>[]
	) {}

	get empty() {
		if (this.content.length) {
			for (let item of this.content) {
				if (item instanceof DataTableGroup) {
					if (!item.empty) {
						return false;
					}
				} else {
					return false;
				}
			}
		}

		return true;
	}

	get firstRow(): RowType | null {
		if (this.content.length) {
			for (let item of this.content) {
				if (item instanceof DataTableGroup) {
					const first = item.firstRow;

					if (first) {
						return first;
					}
				} else {
					return item;
				}
			}
		}

		return null;
	}
}