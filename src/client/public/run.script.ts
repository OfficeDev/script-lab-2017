import { environment } from '../app/helpers';
let { config } = PLAYGROUND;

(() => {
    let ribbons = document.getElementsByClassName('ribbon');
    for (let i = 0; i < ribbons.length; i++) {
        let ribbon = ribbons[i] as HTMLElement;
        switch (environment.current.config.name) {
            case config['insiders'].name:
                ribbon.textContent = 'Beta';
                ribbon.style.background = 'red';
                break;
            case config['edge'].name:
                ribbon.textContent = 'Alpha';
                ribbon.style.background = 'blue';
                break;
            case config['local'].name:
                ribbon.textContent = config['local'].editorUrl;
                ribbon.style.background = 'green';
                break;
            default:
                break;
        }

        if (environment.current.config.name !== config['production'].name) {
            ribbon.style.visibility = 'visible';
        }
    }
})();
