
import { environment, navigateToRunCustomFunctions } from '../app/helpers';

(() => {
    environment.initializePartial({ host: 'EXCEL' });

    navigateToRunCustomFunctions();
})();
