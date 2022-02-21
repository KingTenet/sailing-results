import inBrowser from "./inBrowser.js";

export default async function bootstrapLocalStorage() {
    if (!inBrowser) {
        return import('node-localstorage')
            .then(({ LocalStorage }) => {
                global.localStorage = new LocalStorage('./backend');
            });
    }
}