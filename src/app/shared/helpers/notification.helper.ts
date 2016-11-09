export interface IProgress {
    isShown: boolean;
    message: string;
}

export class NotificationHelper {
    progress: IProgress;

    showProgress(promise: any, message: string) {
        if (promise == null) {
            return;
        }

        this.progress.isShown = true;
        this.progress.message = message || 'Loading';

        return promise.then(
            success => {
                this.progress.isShown = false;
                return success;
            },
            error => {
                this.progress.isShown = false;
                return error;
            }
        ).catch(error => {
            this.progress.isShown = false;
            throw error;
        });
    }
}
