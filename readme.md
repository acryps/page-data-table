# page data table
Create complex data entry tables with ease

- Supports shortcuts to switch between cells, fields and rows
- Smart paste from spreadsheet applications like Excel or Google Docs
- Simple, yet expandable API

## usage
Extend the `DataTable` class and use your component in a page component.
You can extend all of the functions of the DataTable or just use the default implementation.
The functions are documented in code

```
export class BookPricesComponent extends Component {
	books: Book[];
	editions: Edition[];

	async onload() {
		this.books = // get your books
		this.editions = // get your variants, like hardcover, e-book and pocket book
	}

	render() {
		return <ui-books>
			<ui-title>Book Prices</ui-title>

			{new BookPriceTable(books, editions)}
		</ui-books>;
	}
}

class BookPriceTable extends DataTable<Edition, Book> {
	renderColumnHeader(edition: Edition) {
		return edition.name;
	}

	renderRowHeaders(book: Book) {
		return [
			book.name,
			new AuthorComponent(book.author)
		];
	}

	renderCell(edition: Edition, book: Book) {
		let bookEdition = option.standards.find(standard => standard.standardsAgencyId == agency.id) ?? new StandardizedOptionViewModel();

		const nameField = <input 
			type='number'
			$ui-value={bookEdition.price} 
			ui-change={() => save()}
			ui-target='price'
		/>;
		
		const productCodeField = <input 
			type='text'
			$ui-value={bookEdition.isbn} 
			ui-change={() => save()}
			ui-target='isbn'
		/>

		const save = async () => {
			// save the changes
		};

		return [nameField, productCodeField];
	}
}
```