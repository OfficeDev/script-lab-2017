
// import { environment } from '../app/helpers';

// (() => {
//     environment.initializePartial({ host: 'EXCEL' });

//     (window as any).chocolateFactory = {};
//     (window as any).chocolateFactory.createChocolate999 = () => Math.random();
// })();


registerCFs();

function registerCFs() {
    (window as any).chocolateFactory = {};
    (window as any).chocolateFactory.createChocolate999 = function (num: number) {
        debugger;
        return num * 5;
    };
    (window as any).ScriptLab = {
        chocolateFactory: (window as any).chocolateFactory
    };
}

(window as any).createChocolate999 = (num: number) => {
    debugger;
    return 100 * num;
}
// };
