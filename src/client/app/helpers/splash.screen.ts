import { environment } from './environment';
import { Strings } from '../strings';
let { config } = PLAYGROUND;

export function instantiateRibbon(elementId: string): boolean {
    let ribbon = document.getElementById(elementId);
    if (!ribbon) {
        return false;
    }

    let strings = Strings();
    switch (environment.current.config.name) {
        // Utilize Office pallet colors for ribbons
        case config.insiders.name:
            ribbon.textContent = strings.beta;
            ribbon.style.background = 'rgba(43, 87, 154, 1)';
            break;
        case config.edge.name:
            ribbon.textContent = strings.alpha;
            ribbon.style.background = 'rgba(183, 71, 42, 1)';
            break;
        case config.local.name:
            ribbon.textContent = config.local.editorUrl;
            ribbon.style.background = 'rgba(33, 115, 70, 1)';
            break;
        default:
            return false;
    }

    ribbon.style.visibility = 'visible';
    return true;
}
