# book-buddy — PRD

## Problem Statement

A small team keeps a shared library of about 15 books, but there is no easy way to find out what is on the shelf, who wrote a given book, or whether a particular title is currently available. Today someone has to remember the catalogue by heart or physically check the shelf, which wastes time and leads to people not knowing what is available to read.

## Solution

book-buddy is a conversational AI agent that team members chat with to discover books in the team library. It answers questions about what books exist, recommends titles by genre or author, and tells the user whether a specific book is currently available — all backed by a small in-memory catalogue served by library-service. book-buddy only ever talks about books that are actually in the catalogue; it never invents a title.

## Actors

- **Team Member** — anyone on the team who chats with book-buddy to discover books, get recommendations by genre or author, and check whether a book is currently available. Read-only: a Team Member never adds, edits, or removes catalogue entries through book-buddy.

## User Stories

1. As a Team Member, I want to ask book-buddy for book recommendations by genre, so that I can find something on the shelf that matches what I feel like reading.
2. As a Team Member, I want to ask book-buddy for books by a specific author, so that I can find other titles by a writer I like.
3. As a Team Member, I want to ask book-buddy whether a specific book is currently available, so that I know whether I can pick it up right now.
4. As a Team Member, I want book-buddy to only ever mention books that are really in the library catalogue, so that I never get sent looking for a title the team doesn't actually have.
5. As a Team Member, I want to chat with book-buddy through the standard chat interface, so that I don't need to learn a new tool to find a book.

## Product Decisions

- book-buddy is backed by one backend service, library-service, which holds a fixed in-memory catalogue of about 15 books (title, author, genre, year, available true/false), seeded once — there is no database and no way to add, edit, or remove books through the product.
- library-service exposes exactly two read-only operations: `GET /books` (searchBooks, with optional `genre` and `author` filters) and `GET /books/{id}` (getBook).
- book-buddy's tool allow-list is limited to `searchBooks` and `getBook` only — it cannot call any other operation, and it never fabricates a book that isn't returned by one of those two calls.
- book-buddy is read-only end to end: it recommends and reports availability, but never reserves, checks out, or otherwise changes a book's state — there is no borrowing/reservation workflow *(settled by user answer)*.
- There is no web application in this project; team members reach book-buddy through the standard `/chat` interface via the Try It test app.

## Out of Scope

- Any catalogue-management workflow (adding, editing, or removing books, or toggling availability) — the catalogue is fixed seed data.
- Borrowing, reserving, or checking out a book — book-buddy never changes catalogue state.
- A dedicated web application or any UI beyond the standard `/chat` test interface.
- A librarian/admin actor — there is only one actor, the Team Member.
- Persistent storage of any kind — the catalogue lives in memory in library-service.

## Open Questions

None at this time.

