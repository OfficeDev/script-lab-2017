interface ISnippet {
    id: string;
    name: string;
    author?: string;
    script?: {
        content: string;
        language: string;
    };
    template?: {
        content: string;
        language: string;
    };
    style?: {
        content: string;
        language: string;
    };
    libraries: string[];
    readme?: string;
}