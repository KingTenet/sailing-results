import StoreObject from "../../src/store/types/StoreObject.js";
import StoreWrapper from "../../src/store/StoreWrapper.js";

export class HeadToHead extends StoreObject {
    constructor(headers, values, metadata) {
        super(metadata);
        this.headers = headers;
        this.values = values;
    }

    toStore() {
        const values = this.headers.reduce((acc, header, key) => ({
            ...acc,
            [header]: this.values[key]
        }), {});

        return {
            ...values,
            ...super.toStore(this),
        };
    }
}

export class MultiValueWrapper {
    constructor(storeName, sheetDoc, stores, headers, allRows, getId) {
        this.allRows = allRows;
        this.headers = headers;
        this.getId = getId;
        this.storeName = storeName;
        this.sheetDoc = sheetDoc;
        this.stores = stores;
    }

    getHeaders() {
        return {
            ...this.headers,
            ...StoreObject.sheetHeaders(),
        }
    }

    fromAllRows(allRows) {
        return allRows.map((row) => new HeadToHead(this.headers, row, StoreObject.fromStore({})));
    }

    async store(createSheetIfMissing = true) {
        const store = await StoreWrapper.create(
            this.storeName,
            this.sheetDoc,
            this.stores,
            HeadToHead,
            (storeResult) => StoreObject.fromStore({}),
            undefined,
            createSheetIfMissing,
            undefined,
            (obj) => this.getId(obj.values),
            [
                ...this.headers,
                ...StoreObject.sheetHeaders(),
            ],
        );
        for (let row of this.fromAllRows(this.allRows)) {
            store.add(row);
        }
        await store.sync();
    }
}