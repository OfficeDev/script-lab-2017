import { environment } from '../app/helpers';
let { config } = PLAYGROUND;

(() => {
    let ribbon = document.getElementById('ribbon');
    switch (environment.current.config.name) {
        // Utilize Office pallet colors for ribbons
        case config['insiders'].name:
            ribbon.textContent = 'Beta';
            ribbon.style.background = 'rgba(43, 87, 154, 1)';
            break;
        case config['edge'].name:
            ribbon.textContent = 'Alpha';
            ribbon.style.background = 'rgba(183, 71, 42, 1)';
            break;
        case config['local'].name:
            ribbon.textContent = config['local'].editorUrl;
            ribbon.style.background = 'rgba(33, 115, 70, 1)';
            break;
        default:
            break;
    }

    if (environment.current.config.name !== config['production'].name) {
        ribbon.style.visibility = 'visible';
    }
})();
