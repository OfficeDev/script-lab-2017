export class RunnerError extends Error {
    public details: string;
    constructor(message: string, details?: string|any|any[]) {
        super(message);

        if (typeof(details) === 'string') {
            this.details = details;
        } else {
            this.details = JSON.stringify(details, null, 4);
        }
    }
}