export type Book = {
    id: string;
    columnId: string | null;

    createdAt: string;
    title: string;
    color: string;
    estimatedMinutes: number;
    sourceUrl: string;

    isImportant: boolean;

    poppedAt: string | null;

    isArchived: boolean;
    genre: string | null;
    review: string | null;
    rating: number | null;
    nextUrl: string | null;

    /** Unpopped stack order within a column: higher = top of stack (peeking/popping). */
    sortOrder: number;
}

export default Book;