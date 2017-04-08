import '../assets/styles/error.scss';
import { Strings } from '../app/helpers';

(() => {
    const detailsElement = document.getElementById('details');
    const moreDetailsLink = document.getElementById('more-details-link');

    const moreDetailsDefaultText = Strings.ServerError.moreDetails;
    moreDetailsLink.textContent = moreDetailsDefaultText;

    let detailsDisplayed = false;
    moreDetailsLink.onclick = () => {
        if (detailsDisplayed) {
            moreDetailsLink.innerText = '(More details...)';
            detailsElement.style.display = 'none';
        } else {
            detailsElement.style.display = 'block';
            moreDetailsLink.innerText = '(Hide details)';
        }

        detailsDisplayed = !detailsDisplayed;
    };

})();
