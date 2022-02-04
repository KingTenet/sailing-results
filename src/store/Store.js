import LocalStore from "./LocalStore.js";
import RemoteStore from "./RemoteStore.js";
import { parseISOString, getISOStringFromDate } from "../common.js"

export default class Store {
    constructor(storeName, sheetsDoc, toStore, fromStore, getKeyFromObj, services) {
        this.storeName = storeName;
        this.services = services;
        this.toStore = toStore;
        this.fromStore = fromStore;
        this.getKeyFromObj = getKeyFromObj;
        this.metadataKey = `metadata::${this.storeName}`;
        this.localStore = new LocalStore(storeName, toStore, fromStore, getKeyFromObj);
        this.promiseRemoteStore = RemoteStore.createRemoteStore(sheetsDoc, storeName, toStore, fromStore)
            .then((remoteStore) => this.remoteStore = remoteStore);
    }

    async init() {
        let localStoreObjects = this.pullLocalState();
        let localStateEmpty = !localStoreObjects.length;
        if (localStateEmpty) {
            await this.promiseRemoteStore;
            let remoteStoreObjects = await this.pullRemoteState();
            this.syncLocalStateToRemoteState(remoteStoreObjects);
        }
    }

    dump() {
        this.localStore.dump();
        console.log(localStorage.getItem(this.metadataKey));
    }

    syncLocalStateToRemoteState(storeObjects) {
        storeObjects.forEach((storeObject) => this.localStore.bootstrap(this.getKeyFromObj(storeObject), storeObject));
        this.lastSyncDate = new Date();
        localStorage.setItem(this.metadataKey, getISOStringFromDate(this.lastSyncDate));
    }

    async syncRemoteStateToLocalState() {
        const syncDate = this.lastSyncDate;
        const allLocal = this.all();
        let created = allLocal
            .filter((obj) => obj.createdAfterDate(syncDate));

        let updated = allLocal
            .filter((obj) => obj.updatedAfterDate(syncDate))
            .filter((obj) => !created.includes(obj));


        if (!updated.length && !created.length) {
            console.log("No items require updates");
            return;
        }

        const objUpdatedAfterSync = (await this.pullRemoteState()).find((obj) => obj.updatedAfterDate(syncDate))
        if (objUpdatedAfterSync) {
            throw new Error(`Cannot sync because remote state was updated at ${objUpdatedAfterSync.lastUpdated.toISOString()} and was last pulled at ${syncDate.toISOString()}`);
        }

        if (updated.length) {
            // TODO: Implement handling of updating remote state
            // await this.remoteStore.append(updated.map((obj) => this.toStore(obj)));
        }
        if (created.length) {
            await this.remoteStore.append(created.map((obj) => this.toStore(obj)));
        }
        this.lastSyncDate = new Date();
        localStorage.setItem(this.metadataKey, getISOStringFromDate(this.lastSyncDate));
        console.log("Successfully updated remote state");
    }

    pullLocalState() {
        this.lastSyncDate = parseISOString(localStorage.getItem(this.metadataKey), new Date(0));
        return this.localStore.getAll();
    }

    async pullRemoteState() {
        await this.promiseRemoteStore;
        return (await this.remoteStore.getAllRows())
            .map(this.fromStore);
    }

    has(key) {
        return this.localStore.has(key);
    }

    add(obj) {
        return this.localStore.add(this.getKeyFromObj(obj), obj);
    }

    update(obj) {
        return this.localStore.update(this.getKeyFromObj(obj), obj);
    }

    get(key) {
        return this.localStore.get(key);
    }

    all() {
        return this.localStore.getAll();
    }
}
