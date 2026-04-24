export type Book = {
    id: string;
    // userId: string;
    columnId: string;

    createdAt: string;
    title: string;
    color: string;
    estimatedMinutes: number;
    sourceUrl: string;

    isImportant: boolean;

    poppedAt: string | null;

    isArchived: boolean | null;
    genre: string | null;
    review: string | null;
    rating: number | null;
    nextUrl: string | null;
}

export default Book;