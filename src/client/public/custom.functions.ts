
import { environment, navigateToRunCustomFunctions } from '../app/helpers';

(() => {
    environment.initializePartial({ host: 'EXCEL' });
    console.log("INSIDE CUSTOM FUNCTIONS HTML")
    navigateToRunCustomFunctions();
})();
