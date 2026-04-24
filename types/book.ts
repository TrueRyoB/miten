export type Book = {
    id: string;
    label: string;
    color: string;
    estimatedMinutes: number;
    link: string;
    isImportant: boolean;
    pushedAt: string;
    
    poppedAt: string | null;
}

export default Book;