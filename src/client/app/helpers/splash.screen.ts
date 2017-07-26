import { environment } from './environment';
import { Strings } from '../strings';
let { config } = PLAYGROUND;

export function instantiateRibbon(elementId: string) {
    let ribbon = document.getElementById(elementId);
    if (!ribbon) {
        return;
    }
    let strings = Strings();
    switch (environment.current.config.name) {
        // Utilize Office pallet colors for ribbons
        case config['insiders'].name:
            ribbon.textContent = strings.beta;
            ribbon.style.background = 'rgba(43, 87, 154, 1)';
            break;
        case config['edge'].name:
            ribbon.textContent = strings.alpha;
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
}
