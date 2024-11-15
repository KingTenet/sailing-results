import inBrowser from "./inBrowser.js";

class InMemoryLocalStorage {
  constructor() {
    this.stuff = new Map();
  }

  get _keys() {
    return [...this.stuff].map(([key, value]) => key);
  }

  getItem(id) {
    return this.stuff.get(id);
  }

  setItem(id, obj) {
    this.stuff.set(id, obj);
  }

  removeItem(id) {
    this.stuff.delete(id);
  }

  clear() {
    this.stuff = new Map();
  }
}

export default async function bootstrapLocalStorage() {
  if (!inBrowser) {
    global.localStorage = new InMemoryLocalStorage();

    // return import("node-localstorage").then(({ LocalStorage }) => {
    //   global.localStorage = new LocalStorage("./backend");
    // });
  }
}
