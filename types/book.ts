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
}

export default Book;