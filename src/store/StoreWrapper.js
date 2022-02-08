import Result from "./types/Result.js";
import Store from "./Store.js";

function debugCreationErrors(func, storeObject) {
    try {
        return func();
    }
    catch (err) {
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
        let helms = this.store.all();
        return helms.map((helm) => func(helm));
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

    async sync() {
        return await this.store.syncRemoteStateToLocalState();
    }

    static async create(storeName, raceResultsDocument, services, Type, fromStore = Type.fromStore, toStore = (obj) => obj.toStore(), getId = Type.getId) {
        let store = new Store(storeName, raceResultsDocument, toStore, (...args) => debugCreationErrors(() => fromStore(...args), ...args), getId, services);
        await store.init();
        return new StoreWrapper(store);
    }
}