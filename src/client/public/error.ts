import '../assets/styles/error.scss';
import { Strings } from '../app/strings';

(window as any).initializeErrorView = (expandDetailsByDefault: boolean) => {
    const strings = Strings();

    const detailsElement = document.getElementById('details');
    const moreDetailsLink = document.getElementById('more-details-link');

    const moreDetailsDefaultText = strings.ServerError.moreDetails;
    moreDetailsLink.textContent = moreDetailsDefaultText;

    moreDetailsLink.onclick = () => toggleShowDetails(detailsElement.style.display === 'none' /*show*/);


    toggleShowDetails(expandDetailsByDefault);
    if (expandDetailsByDefault) {
        moreDetailsLink.style.display = 'none';
    }


    try {
        (window.parent as any).scriptRunnerBeginInit();
        (window.parent as any).scriptRunnerEndInit();
    }
    catch (e) {
        /* ignore*/
    }


    // Helper:

    function toggleShowDetails(show: boolean) {
        if (show) {
            detailsElement.style.display = 'block';
            moreDetailsLink.innerText = '(' + strings.ServerError.hideDetails + ')';
        } else {
            moreDetailsLink.innerText = '(' + strings.ServerError.moreDetails + ')';
            detailsElement.style.display = 'none';
        }
    }
};
