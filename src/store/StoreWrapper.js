import Store from "./Store.js";
import StoreObject from "./types/StoreObject.js";

function debugCreationErrors(func, storeObject) {
    try {
        return func();
    }
    catch (err) {
        console.log(err);
        console.log(`Failed to create object from store`);
        console.log(storeObject);
        throw err;
    }
}

export default class StoreWrapper {
    constructor(store) {
        this.store = store;
    }

    async init() {
        await this.store.init();
    }

    async dump() {
        return await this.store.dump();
    }

    all() {
        return this.store.all();
    }

    map(func) {
        let objs = this.store.all();
        return objs.map((obj) => func(obj));
    }

    mapReplace(func) {
        this.map((...args) => {
            let newObj = func(...args);
            return this.update(newObj);
        })
    }

    count() {
        return this.all().length;
    }

    get(key) {
        return this.store.get(key);
    }

    has(key) {
        return this.store.has(key);
    }

    add(value) {
        return this.store.add(value);
    }

    update(...args) {
        return this.store.update(...args);
    }

    delete(...args) {
        return this.store.delete(...args);
    }

    clear() {
        return this.store.clear();
    }

    async sync(force = false) {
        return await this.store.syncRemoteStateToLocalState(force);
    }

    static async create(storeName, raceResultsDocument, services, Type, fromStore = Type.fromStore, batch = (all) => all.map(fromStore), createSheetIfMissing = false, toStore = (obj) => obj.toStore(), getId = Type.getId, sheetHeaders = Type.sheetHeaders()) {
        let store = new Store(
            storeName,
            raceResultsDocument,
            (...args) => StoreObject.validateHeaders(toStore(...args), Type),
            (...args) => debugCreationErrors(() => batch(...args), ...args),
            getId,
            services,
            createSheetIfMissing,
            sheetHeaders,
        );
        await store.init();
        return new StoreWrapper(store);
    }
}