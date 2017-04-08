import '../assets/styles/error.scss';
import { Strings } from '../app/helpers';

(window as any).initializeErrorView = (expandDetailsByDefault: boolean) => {
    const detailsElement = document.getElementById('details');
    const moreDetailsLink = document.getElementById('more-details-link');

    const moreDetailsDefaultText = Strings.ServerError.moreDetails;
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
            moreDetailsLink.innerText = '(Hide details)';
        } else {
            moreDetailsLink.innerText = '(More details...)';
            detailsElement.style.display = 'none';
        }
    }
};
