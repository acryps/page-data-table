import { Component, ComponentContent } from '@acryps/page';
import { DataTableGroup } from './group';
import { RenderedField } from './rendered/field';
import { RenderedCell } from './rendered/cell';
import { RenderedRow } from './rendered/row';
import { RenderedGroup } from './rendered/group';

export class DataTable<ColumnType, RowType> extends Component {
	// target based navigation
	nextCellShortcut = (event: KeyboardEvent) => event.key == 'ArrowRight';
	previousCellShortcut = (event: KeyboardEvent) => event.key == 'ArrowLeft';
	nextRowShortcut = (event: KeyboardEvent) => event.key == 'ArrowDown';
	previousRowShortcut = (event: KeyboardEvent) => event.key == 'ArrowUp';

	// index based navigation
	nextFieldShortcut = (event: KeyboardEvent) => event.key == 'Tab' && !event.shiftKey;
	previousFieldShortcut = (event: KeyboardEvent) => event.key == 'Tab' && event.shiftKey;

	// pasting functions
	pasteSplitRows = (table: string) => table.split('\n').map(line => line.replace('\r', ''));
	pasteSplitCells = (row: string) => row.split('\t');

	private columns: ColumnType[];
	private rootGroup: DataTableGroup<RowType>;

	constructor(
		columns?: ColumnType[],
		rowsOrGroups?: RowType[] | DataTableGroup<RowType>[]
	) {
		super();

		if (columns) {
			this.load(columns, rowsOrGroups);
		}
	}

	load(columns: ColumnType[], rowsOrGroups: RowType[] | DataTableGroup<RowType>[] | null) {
		this.columns = columns;

		if (Array.isArray(rowsOrGroups)) {
			this.rootGroup = new DataTableGroup<RowType>(null, rowsOrGroups as RowType[]);
		} else {
			this.rootGroup = new DataTableGroup<RowType>(null, []);
		}

		requestAnimationFrame(() => this.update());
	}

	loadRows(rows: RowType[]) {
		this.rootGroup.content = rows;

		requestAnimationFrame(() => this.update());
	}

	loadGroup(group: DataTableGroup<RowType>) {
		this.rootGroup = group;

		requestAnimationFrame(() => this.update());
	}

	loadGroups(groups: DataTableGroup<RowType>[]) {
		this.rootGroup.content = groups;

		requestAnimationFrame(() => this.update());
	}

	render() {
		const columnHeaders = this.columns.map(column => this.wrapInElement(this.renderColumnHeader(column), 'ui-header'));
		let pivots: Element[];
		let content: Element;

		if (this.rootGroup.empty) {
			pivots = [];
			content = this.wrapInElement(this.renderEmptyTableMessage(), 'ui-empty');
		} else {
			// create pivot cells from first rows header count
			const firstRow = this.rootGroup.firstRow!;
			const firstRowHeaders = this.renderRowHeaders(firstRow);
			pivots = [];

			for (let headerIndex = 0; headerIndex < firstRowHeaders.length; headerIndex++) {
				pivots.push(this.wrapInElement(this.renderPivot(headerIndex), 'ui-pivot'));
			}

			const root = this.renderGroup(this.rootGroup, firstRowHeaders);

			requestAnimationFrame(() => {
				for (let row of root.rows) {
					for (let cell of row.cells) {
						cell.fields = this.findFields(cell.source);

						this.registerShortcuts(cell, row, root.rows);
						this.registerPaste(cell, row, root.rows);
					}
				}
			});

			content = root.source;
		}

		return <ui-data-table>
			<ui-column-headers>
				<ui-pivots>
					{pivots}
				</ui-pivots>
				
				{columnHeaders}
			</ui-column-headers>

			<ui-content>
				{content}
			</ui-content>
		</ui-data-table>;
	}

	private renderGroup(group: DataTableGroup<RowType>, firstHeaders: ComponentContent[] | null): RenderedGroup {
		let header: ComponentContent;
		const content: HTMLElement[] = [];
		const rows: RenderedRow[] = [];

		if (group.header !== undefined) {
			header = this.renderGroupHeader(group);
		}

		for (let item of group.content) {
			if (item instanceof DataTableGroup) {
				const child = this.renderGroup(item, null);

				rows.push(...child.rows);
				content.push(child.source);
			} else {
				// reuse the first headers used to get the pivot cell count
				let rowHeaders;

				if (firstHeaders) {
					rowHeaders = firstHeaders;
					firstHeaders = null;
				} else {
					rowHeaders = this.renderRowHeaders(item);
				}

				const cells = this.columns.map(column => new RenderedCell(
					this.wrapInElement(this.renderCell(column, item as RowType), 'ui-cell')
				));

				const row = new RenderedRow(
					<ui-row>
						<ui-row-headers>
							{rowHeaders.map(header => this.wrapInElement(header, 'ui-header'))}
						</ui-row-headers>

						{cells.map(cell => cell.source)}
					</ui-row>,
					cells
				)

				rows.push(row);
				content.push(row.source);
			}
		}

		return new RenderedGroup(
			<ui-group>
				{this.wrapInElement(header, 'ui-header')}

				{content}
			</ui-group>,
			rows
		);
	}

	/**
	 * Renders the pivot (empty column between the column and row headers)
	 * 
	 * @param index Index of the pivot cell
	 */
	renderPivot(index: number): ComponentContent {
		return <ui-pivot></ui-pivot>;
	}

	/**
	 * Handles empty tables
	 * 
	 * @returns Content
	 */
	renderEmptyTableMessage(): ComponentContent {
		return 'No data';
	}

	/**
	 * Renders the header of a column
	 * 
	 * @param column Current column
	 * @returns The rendered header column
	 */
	renderColumnHeader(column: ColumnType): ComponentContent {
		return `${column}`;
	}

	/**
	 * Renders the headers of a row
	 * *All rows must return the same number to headers*
	 * 
	 * @param row Current row
	 * @returns An array of rows, which will be wrapped in `<ui-header>` automatically, unless a <ui-header> is returned
	 */
	renderRowHeaders(row: RowType): ComponentContent[] {
		return [];
	}

	/**
	 * Renders a groups header
	 * This function will not be called for groups where the header is `undefined` (default group if none present)
	 * 
	 * @param group Current group
	 * @returns Rendered header
	 */
	renderGroupHeader(group: DataTableGroup<RowType>): ComponentContent {
		return group.header;
	}

	/**
	 * Renders one cell
	 * Any form field (`<select>` or `<input>`) will automatically be used when cycling inputs. Overwrite `findFields` for custom behavior
	 * 
	 * @param column Current column
	 * @param row Current row
	 * @returns The rendered column
	 */
	renderCell(column: ColumnType, row: RowType): ComponentContent {
		return;
	}

	/**
	 * Returns all form fields in a rendered cell
	 * The fields will be used in input focusing
	 * 
	 * @param rendered The rendered cell
	 * @returns Found fields
	 */
	findFields(rendered: HTMLElement) {
		const fields: RenderedField[] = [];

		if (rendered.tagName == 'INPUT' || rendered.tagName == 'SELECT') {
			const target = rendered.getAttribute('ui-target');

			if (target) {
				fields.push(
					new RenderedField(rendered, target)
				);
			}
		} else if (rendered.childElementCount) {
			for (const child of rendered.children) {
				fields.push(...this.findFields(child as HTMLElement));
			}
		}

		return fields;
	}

	/**
	 * Gets the fields target. 
	 * When the user uses the arrow keys to move between cells, not the field at the same index but the cell with the same target will be picked
	 * If no target is set (using `ui-target`), the target will just be the fields index
	 * 
	 * @example Field jumping with arrow key
	 * Table Row: <A> <C> | <A> <B> <C>
	 * Pressing [→] while on <C> (field 2) of cell 1 will focus <C> (field 3) on cell 2
	 * 
	 * @param field The current field
	 * @param fields All fields in this cell
	 */
	getFieldTarget(field: Element, fields: Element[]) {
		if (field.hasAttribute('ui-target')) {
			return field.getAttribute('ui-target');
		}

		return `${fields.indexOf(field)}`;
	}

	/**
	 * Focuses a field in a cell by target name
	 * 
	 * @param cell The cell where the field is contained
	 * @param target The cells target
	 */
	focusField(cell: RenderedCell, target: string) {
		for (let field of cell.fields) {
			if (field.target == target) {
				field.source.focus();

				// focus entire text if possible
				if (field.source.tagName == 'INPUT') {
					const input = field.source as HTMLInputElement;

					requestAnimationFrame(() => input.select());
				}
			}
		}
	}

	/**
	 * Writes a value to a field
	 * 
	 * @param cell The cell where the field is in
	 * @param target The fields target
	 */
	writeField(cell: RenderedCell, target: string, value: string) {
		for (let field of cell.fields) {
			if (field.target == target) {
				if (field.source.tagName == 'INPUT' || field.source.tagName == 'SELECT') {
					const input = field.source as HTMLInputElement;
					input.value = value;

					// trigger setters
					requestAnimationFrame(() => input.focus());
					requestAnimationFrame(() => input.blur());
				}
			}
		}
	}

	/**
	 * Write a bunch of data into the table at the current position
	 */
	spread(cursorField: RenderedField, cursorCell: RenderedCell, cursorRow: RenderedRow, table: RenderedRow[], data: string[][]) {
		if (!data.length) {
			return;
		}

		const dataColumnCount = data[0].length;

		const cursorRowIndex = table.indexOf(cursorRow);
		const cursorCellIndex = cursorRow.cells.indexOf(cursorCell);

		// find all fields that are present in the table starting at the cursor location
		// 
		// <A>     | <C> <D>
		// <A> <B> |     <D>
		//
		// → <A> <B> <C> <D>
		const cellFields: string[][] = [];

		for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
			const tableRow = table[cursorRowIndex + rowIndex];
			
			for (let cellIndex = cursorCellIndex; cellIndex < tableRow.cells.length; cellIndex++) {
				for (let field of tableRow.cells[cellIndex].fields) {
					const cellField = cellFields[cellIndex];

					if (cellField && !cellField.includes(field.target)) {
						cellField.push(field.target);
					} else {
						cellFields[cellIndex] = [field.target];
					}
				}
			}
		}

		// limit the number of fields to the data length, offset by the cursors field index
		// 
		// focus was on <B>, 2 columns
		// <A> <B> <C> <D> → <B> <C>
		const cursorFieldIndex = cellFields[cursorCellIndex].indexOf(cursorField.target);
		const insertingFields = cellFields.flatMap((targets, cellIndex) => targets.map(target => ({ cellIndex, target }))).slice(cursorFieldIndex, dataColumnCount + cursorFieldIndex);

		// write data into the fields
		// this will write data into the fields in order
		// writeField will just do nothing if the field with the target name does not exist
		for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
			const tableRow = table[cursorRowIndex + rowIndex];
			const dataRow = data[rowIndex];

			for (let fieldIndex = 0; fieldIndex < insertingFields.length; fieldIndex++) {
				const insertingField = insertingFields[fieldIndex];
				const cell = tableRow.cells[insertingField.cellIndex];

				if (cell) {
					this.writeField(cell, insertingField.target, dataRow[fieldIndex]);
				}
			}
		}
	}

	/**
	 * Register keyboard shortcuts for one cell
	 * 
	 * @param cell The rendered cell
	 * @param fields The fields within the cell
	 */
	registerShortcuts(cell: RenderedCell, row: RenderedRow, table: RenderedRow[]) {
		for (let field of cell.fields) {
			field.source.addEventListener('keydown', event => {
				if (this.nextCellShortcut(event)) {
					const nextCell = row.cells[row.cells.indexOf(cell) + 1];

					if (nextCell) {
						this.focusField(nextCell, field.target);

						event.preventDefault();
					}
				}

				if (this.previousCellShortcut(event)) {
					const previousCell = row.cells[row.cells.indexOf(cell) - 1];

					if (previousCell) {
						this.focusField(previousCell, field.target);

						event.preventDefault();
					}
				}

				if (this.nextRowShortcut(event)) {
					const nextRow = table[table.indexOf(row) + 1];

					if (nextRow) {
						this.focusField(nextRow.cells[row.cells.indexOf(cell)], field.target);

						event.preventDefault();
					}
				}

				if (this.previousRowShortcut(event)) {
					const previousRow = table[table.indexOf(row) - 1];

					if (previousRow) {
						this.focusField(previousRow.cells[row.cells.indexOf(cell)], field.target);

						event.preventDefault();
					}
				}

				if (this.nextFieldShortcut(event)) {
					this.focusField(cell, (cell.fields[cell.fields.indexOf(field) + 1] ?? cell.fields[0]).target);

					event.preventDefault();
				}

				if (this.previousFieldShortcut(event)) {
					this.focusField(cell, (cell.fields[cell.fields.indexOf(field) - 1] ?? cell.fields[cell.fields.length - 1]).target);

					event.preventDefault();
				}
			});
		}
	}

	registerPaste(cell: RenderedCell, row: RenderedRow, table: RenderedRow[]) {
		for (let field of cell.fields) {
			field.source.addEventListener('paste', event => {
				const content = event.clipboardData.getData('text')?.trim() ?? '';

				const rows = this.pasteSplitRows(content);
				const cells = this.pasteSplitCells(content);

				if (cells.length > 1 || rows.length > 1) {
					event.preventDefault();

					this.spread(field, cell, row, table, rows.map(row => this.pasteSplitCells(row)));
				}
			});
		}
	}

	private wrapInElement(content: ComponentContent, tagName: string) {
		if (content instanceof HTMLElement && content.tagName.toLowerCase() == tagName.toLowerCase()) {
			return content;
		}

		return this.createElement(tagName, null, content) as HTMLElement;
	}
}