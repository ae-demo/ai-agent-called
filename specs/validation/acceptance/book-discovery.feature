Feature: Book discovery

  @story-1
  Rule: A Team Member can get book recommendations by genre

    Scenario: Asking for a mystery recommendation
      Given the library catalogue includes a mystery book named "The Silent Patient"
      When Priya the team member asks book-buddy for a mystery book to read
      Then book-buddy recommends "The Silent Patient"

    @negative
    Scenario: No book matches the requested genre
      Given the library catalogue has no book in the "poetry" genre
      When Priya the team member asks book-buddy for a poetry recommendation
      Then book-buddy tells her it found no poetry books in the catalogue

  @story-2
  Rule: A Team Member can find books by a specific author

    Scenario: Asking for books by a known author
      Given the library catalogue includes two books by "Agatha Christie"
      When Priya the team member asks book-buddy for books by "Agatha Christie"
      Then book-buddy lists both of "Agatha Christie"'s books

    @negative
    Scenario: No book matches the requested author
      Given the library catalogue has no book by "Jane Doe Author"
      When Priya the team member asks book-buddy for books by "Jane Doe Author"
      Then book-buddy tells her it found no books by "Jane Doe Author"

  @story-3
  Rule: A Team Member can check whether a specific book is currently available

    Scenario: The book is on the shelf
      Given "Project Hail Mary" is marked available in the catalogue
      When Priya the team member asks book-buddy whether "Project Hail Mary" is available
      Then book-buddy tells her "Project Hail Mary" is available

    @negative
    Scenario: The book is checked out
      Given "Dune" is marked unavailable in the catalogue
      When Priya the team member asks book-buddy whether "Dune" is available
      Then book-buddy tells her "Dune" is not currently available

  @story-4 @negative
  Rule: book-buddy never mentions a book that isn't in the catalogue

    Scenario: Asking about a title the library doesn't have
      Given the library catalogue has no book named "The Nonexistent Chronicles"
      When Priya the team member asks book-buddy about "The Nonexistent Chronicles"
      Then book-buddy tells her it could not find that book in the catalogue
      And book-buddy does not describe or recommend "The Nonexistent Chronicles"

  @story-5
  Rule: A Team Member reaches book-buddy through the standard chat interface

    Scenario: Starting a conversation through the Try It test app
      Given Priya the team member opens the Try It test app for book-buddy
      When she sends a message asking what genres are in the library
      Then book-buddy responds in the same conversation with genres drawn from the catalogue
