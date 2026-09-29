# Domain Model

The catalogue is a single entity: a Book, seeded once in memory by library-service and never written to by the product.

```mermaid
erDiagram
    BOOK {
        string id PK
        string title
        string author
        string genre
        int year
        boolean available
    }
```

- **Book** — one of the \~15 seed titles in the team library. `available` reflects whether the physical copy is currently on the shelf; nothing in this product ever changes it.

