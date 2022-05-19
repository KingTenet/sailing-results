import StoreObject from "./types/StoreObject.js"
import inBrowser from "../inBrowser.js";
const KEY_SEP = "##"

export default class LocalStore {
    constructor(storeName, toStore, fromStore, store) {
        this.storeName = storeName;
        this.localStorage = localStorage;
        this.toStore = toStore;
        this.fromStore = fromStore;
        this.store = store;
        this.cache = new Map();
        this.modifiedKeys = [];
        this.newKeys = [];
        this.fillCache();
    }

    dump() {
        console.log(JSON.stringify([...this.cache.values()].map((obj) => this.toStore(obj)), null, 4))
    }

    keyToStoreKey(key) {
        return [this.storeName, key].join(KEY_SEP);
    }

    storeKeyToKey(storeKey) {
        const components = storeKey.split(`${this.storeName}${KEY_SEP}`);
        return components[1];
    }

    bootstrap(keyValues) {
        for (let [key, value] of keyValues) {
            this.addToLocalStorage(key, this.toStore(value));
        }
        this.fillCache();
    }

    add(key, value, bootstrap = false) {
        if (this.cache.has(key)) {
            throw new Error(`Cannot add object with key ${key} to store as it already exists`);
        }
        let newValue = !bootstrap ? StoreObject.addCreatedDate(value) : value;
        let storeValue = this.toStore(newValue);
        this.cache.set(key, newValue);
        this.addToLocalStorage(key, storeValue);
        return key;
    }

    update(key, newValue) {
        if (!this.cache.has(key)) {
            throw new Error(`Cannot update object with key ${key} to store as it doesn't exist`);
        }
        let valueWithMeta = StoreObject.addModifiedDate(newValue);
        let storeValue = this.toStore(valueWithMeta);
        this.cache.set(key, valueWithMeta);
        this.updateLocalStorage(key, storeValue);
    }

    updateLocalStorage(key, newValue) {
        let storeKey = this.keyToStoreKey(key);
        if (!this.localStorage.getItem(storeKey)) {
            throw new Error(`Attempting to update object with key ${key} to local storage when it doesn't exist`);
        }

        this.localStorage.setItem(storeKey, JSON.stringify(newValue));
    }

    deleteLocalStorage(key) {
        let storeKey = this.keyToStoreKey(key);
        if (!this.localStorage.getItem(storeKey)) {
            throw new Error(`Attempting to delete object with key ${key} from local storage when it doesn't exist`);
        }

        this.localStorage.removeItem(storeKey);
    }

    addToLocalStorage(key, value) {
        let storeKey = this.keyToStoreKey(key);
        if (this.localStorage.getItem(storeKey)) {
            throw new Error(`Attempting to add object with key ${key} to local storage when it already exists`);
        }
        this.localStorage.setItem(storeKey, JSON.stringify(value));
    }

    has(key) {
        return this.cache.has(key);
    }

    get(key) {
        if (!this.cache.has(key)) {
            throw new Error(`Cannot get object with key ${key} from store as it doesn't exist`);
        }
        return this.cache.get(key);
    }

    delete(key) {
        if (!this.cache.has(key)) {
            throw new Error(`Cannot delete object with key ${key} to store as it doesn't exist`);
        }
        this.cache.delete(key);
        this.deleteLocalStorage(key);
    }

    getAll() {
        return [...this.cache.values()];
    }

    fillCache() {
        const keys = inBrowser
            ? Object.keys(this.localStorage)
            : this.localStorage._keys

        let i = keys.length;
        const keyValues = [];

        while (i--) {
            let key = this.storeKeyToKey(keys[i]);
            if (!key) {
                continue;
            }

            keyValues.push([key, JSON.parse(this.localStorage.getItem(keys[i]))]);
        }

        let mappedValues = this.fromStore(keyValues.map(([, values]) => values));

        mappedValues
            .forEach((mappedValue, i) => {
                mappedValue.setStore(this.store);
                this.cache.set(keyValues[i][0], mappedValue);
            });
    }
}