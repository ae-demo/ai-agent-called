// Pagination helpers for the searchBooks envelope (`count`, `next`, `previous`,
// `data`) — slicing a page out of the filtered catalogue and building the
// relative page URIs the contract's `next`/`previous` fields carry.

import ballerina/url;

# One page of an already-filtered result set.
#
# + rows - the full filtered result, in catalogue order
# + offset - how many leading rows to skip
# + 'limit - how many rows to keep after the skip
# + return - the rows in `[offset, offset + limit)`, or `[]` when `offset` is
#            past the end
isolated function pageOf(Book[] rows, int offset, int 'limit) returns Book[] {
    int total = rows.length();
    if offset >= total || 'limit == 0 {
        return [];
    }
    int end = offset + 'limit;
    if end > total {
        end = total;
    }
    return rows.slice(offset, end);
}

# The `offset` a `previous` link should carry — one page back, floored at `0`.
#
# + offset - the current page's offset
# + 'limit - the current page's limit
# + return - the offset one page earlier
isolated function offsetForPrevious(int offset, int 'limit) returns int {
    int previous = offset - 'limit;
    return previous < 0 ? 0 : previous;
}

# A relative `/books` URI carrying the same filters with a different page.
#
# + genre - the genre filter to preserve, when given
# + author - the author filter to preserve, when given
# + 'limit - the page size to encode
# + offset - the page offset to encode
# + return - a relative URI such as `/books?genre=Fantasy&limit=20&offset=20`
isolated function pageUri(string? genre, string? author, int 'limit, int offset) returns string {
    string query = string `limit=${'limit}&offset=${offset}`;
    if genre is string {
        string|url:Error encoded = url:encode(genre, "UTF-8");
        query = string `genre=${encoded is string ? encoded : genre}&${query}`;
    }
    if author is string {
        string|url:Error encoded = url:encode(author, "UTF-8");
        query = string `${query}&author=${encoded is string ? encoded : author}`;
    }
    return string `/books?${query}`;
}
