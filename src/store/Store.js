import LocalStore from "./LocalStore.js";
import RemoteStore from "./RemoteStore.js";
import { parseISOString, getISOStringFromDate, isOnline } from "../common.js";
import inBrowser from "../inBrowser.js";

export default class Store {
  constructor(
    storeName,
    sheetsDoc,
    toStore,
    fromStore,
    getKeyFromObj,
    services,
    createSheetIfMissing,
    headers
  ) {
    this.storeName = storeName;
    this.services = services;
    this.toStore = toStore;
    this.fromStore = fromStore;
    this.getKeyFromObj = getKeyFromObj;
    this.metadataKey = `metadata::${this.storeName}`;
    this.getLastSyncDate();
    this.localStore = new LocalStore(storeName, toStore, fromStore, this);
    this.promiseRemoteStore = RemoteStore.retryCreateRemoteStore(
      sheetsDoc,
      storeName,
      createSheetIfMissing,
      headers
    ).then((remoteStore) => (this.remoteStore = remoteStore));
  }

  async init() {
    const localStoreObjects = this.pullLocalState();
    let localStateEmpty = !localStoreObjects.length;

    if (localStateEmpty) {
      console.log("Local state is empty of " + this.storeName);
    }

    if (localStateEmpty) {
      this.clear();
      let remoteStoreObjects = await this.pullRemoteState();
      this.syncLocalStateToRemoteState(remoteStoreObjects);
    }
  }

  syncLocalStateToRemoteState(storeObjects) {
    this.localStore.bootstrap(
      storeObjects.map((storeObject) => [
        this.getKeyFromObj(storeObject),
        storeObject,
      ])
    );
    this.setLastSyncDate();
  }

  setLastSyncDate() {
    this.lastSyncDate = new Date();
    localStorage.setItem(
      this.metadataKey,
      getISOStringFromDate(this.lastSyncDate)
    );
  }

  getLastSyncDate() {
    if (!this.lastSyncDate) {
      this.lastSyncDate = parseISOString(
        localStorage.getItem(this.metadataKey),
        new Date(0)
      );
    }
    return this.lastSyncDate;
  }

  // Should perhaps be called localStoreIsUnchanged
  storesInSync() {
    // return true;
    const syncDate = this.getLastSyncDate();
    const allLocal = this.all();
    let created = allLocal.filter((obj) => obj.createdAfterDate(syncDate));

    let updated = allLocal
      .filter((obj) => obj.updatedAfterDate(syncDate))
      .filter((obj) => !created.includes(obj));

    return !updated.length && !created.length;
  }

  async syncRemoteStateToLocalState(force = false) {
    console.log(`Syncing store ${this.storeName}`);
    const syncDate = this.getLastSyncDate();

    this.setLastSyncDate();
    return;

    const allLocal = this.all();
    let created = allLocal.filter((obj) => obj.createdAfterDate(syncDate));

    let updated = allLocal
      .filter((obj) => obj.updatedAfterDate(syncDate))
      .filter((obj) => !created.includes(obj));

    if (!updated.length && !created.length) {
      console.log(`No items require updates ${this.storeName}`);
    } else {
      const objUpdatedAfterSync = (await this.pullRemoteState()).find((obj) =>
        obj.updatedAfterDate(syncDate)
      );
      if (objUpdatedAfterSync) {
        throw new Error(
          `Cannot sync store ${
            this.storeName
          } because remote state was updated at ${objUpdatedAfterSync.lastUpdated.toISOString()} and was last pulled at ${syncDate.toISOString()}`
        );
      }

      if (updated.length && force) {
        // TODO: Implement handling of updating remote state
        // await this.remoteStore.append(updated.map((obj) => this.toStore(obj)));
      }
      if (created.length) {
        await this.remoteStore.append(created.map((obj) => this.toStore(obj)));
      }
      console.log(
        `Successfully updated remote state for store: ${this.storeName}`
      );
    }
    this.setLastSyncDate();
  }

  pullLocalState() {
    this.getLastSyncDate();
    return this.localStore.getAll();
  }

  async pullRemoteState() {
    await this.promiseRemoteStore;
    return this.fromStore(await this.remoteStore.getAllRows());
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

  delete(obj) {
    return this.localStore.delete(this.getKeyFromObj(obj));
  }

  clear() {
    // const allValues = this.all();
    // allValues.forEach((value) => this.delete(value));
    this.localStore.clearCache();
  }

  dump() {
    this.localStore.dump();
    console.log(this.lastSyncDate);
  }
}
