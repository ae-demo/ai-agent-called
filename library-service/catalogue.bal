// The team library's fixed in-memory catalogue. Seeded once at startup — no
// database, no persistence, and no write path: this module offers only reads.

// Module-level startup work: build the catalogue table before the listener
// starts serving requests.
final Book[] & readonly catalogue = [
    {id: "b01", title: "Clean Code", author: "Robert C. Martin", genre: "Software Engineering", year: 2008, available: true},
    {id: "b02", title: "The Pragmatic Programmer", author: "David Thomas", genre: "Software Engineering", year: 1999, available: true},
    {id: "b03", title: "Design Patterns", author: "Erich Gamma", genre: "Software Engineering", year: 1994, available: false},
    {id: "b04", title: "Dune", author: "Frank Herbert", genre: "Science Fiction", year: 1965, available: true},
    {id: "b05", title: "Foundation", author: "Isaac Asimov", genre: "Science Fiction", year: 1951, available: true},
    {id: "b06", title: "Neuromancer", author: "William Gibson", genre: "Science Fiction", year: 1984, available: false},
    {id: "b07", title: "The Hobbit", author: "J.R.R. Tolkien", genre: "Fantasy", year: 1937, available: true},
    {id: "b08", title: "A Game of Thrones", author: "George R.R. Martin", genre: "Fantasy", year: 1996, available: true},
    {id: "b09", title: "Mistborn", author: "Brandon Sanderson", genre: "Fantasy", year: 2006, available: false},
    {id: "b10", title: "Sapiens", author: "Yuval Noah Harari", genre: "Non-Fiction", year: 2011, available: true},
    {id: "b11", title: "Thinking, Fast and Slow", author: "Daniel Kahneman", genre: "Non-Fiction", year: 2011, available: true},
    {id: "b12", title: "Educated", author: "Tara Westover", genre: "Memoir", year: 2018, available: true},
    {id: "b13", title: "1984", author: "George Orwell", genre: "Dystopian", year: 1949, available: false},
    {id: "b14", title: "Brave New World", author: "Aldous Huxley", genre: "Dystopian", year: 1932, available: true},
    {id: "b15", title: "The Silent Patient", author: "Alex Michaelides", genre: "Thriller", year: 2019, available: true}
];

// The maximum page size the contract allows.
const int MAX_LIMIT = 100;
// The default page size when the caller supplies none.
const int DEFAULT_LIMIT = 20;

# Filters the catalogue by an optional genre and/or author, both matched
# case-insensitively against the whole field.
#
# + genre - filter to books of this genre, when given
# + author - filter to books by this author, when given
# + return - every catalogue row matching both filters, in catalogue order
isolated function filterCatalogue(string? genre, string? author) returns Book[] {
    string? genreLower = genre is string ? genre.toLowerAscii() : ();
    string? authorLower = author is string ? author.toLowerAscii() : ();
    return from Book book in catalogue
        where genreLower is () || book.genre.toLowerAscii() == genreLower
        where authorLower is () || book.author.toLowerAscii() == authorLower
        select book;
}

# One catalogue row by id.
#
# + id - the book id
# + return - the matching book, or `()` when no book has this id
isolated function findBook(string id) returns Book? {
    Book[] found = from Book book in catalogue
        where book.id == id
        select book;
    return found.length() > 0 ? found[0] : ();
}

# Clamps a caller-supplied `limit` into the contract's bounds (`0`..`100`).
#
# + requested - the `limit` query parameter as received
# + return - the same value clamped to `[0, MAX_LIMIT]`
isolated function clampLimit(int requested) returns int {
    if requested < 0 {
        return DEFAULT_LIMIT;
    }
    if requested > MAX_LIMIT {
        return MAX_LIMIT;
    }
    return requested;
}

# Clamps a caller-supplied `offset` to a non-negative value.
#
# + requested - the `offset` query parameter as received
# + return - the same value, floored at `0`
isolated function clampOffset(int requested) returns int {
    return requested < 0 ? 0 : requested;
}
