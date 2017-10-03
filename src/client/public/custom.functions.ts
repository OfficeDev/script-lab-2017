import { environment, navigateToCompileCustomFunctions } from '../app/helpers';

(() => {
    environment.initializePartial({ host: 'EXCEL' });
    navigateToCompileCustomFunctions('run');
})();
