
// import { environment } from '../app/helpers';

// (() => {
//     environment.initializePartial({ host: 'EXCEL' });

//     (window as any).chocolateFactory = {};
//     (window as any).chocolateFactory.createChocolate = () => Math.random();
// })();


(window as any).createChocolate = (num : number) => {
    return num * 5;
};

// };
