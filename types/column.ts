import Book from "./book";

export type Column = {
    id: string;
    label: string;
    books: Book[];
    createdAt: string;
    color: string;

    poppedAt: string | null;
};
