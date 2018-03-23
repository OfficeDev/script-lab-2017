import { environment, navigateToRegisterCustomFunctions } from '../app/helpers';

(() => {
    environment.initializePartial({ host: 'EXCEL' });
    navigateToRegisterCustomFunctions();
})();
