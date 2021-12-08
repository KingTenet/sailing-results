import logo from './logo.svg';
import React from "react";
import {useState} from "react";
import fuzzysort from "fuzzysort";
import './App.css';
// import Autocomplete from "./Autocomplete";
import Autocomplete from "./Autocomplete";
import { Stack } from "@chakra-ui/react";

const exampleHelm = {
  name: "Felix Morley",
  memberId: 124,
  joinedDate: 12345,
  yearOfBirth: 1985,
  gender: "Male"
};

const lotsofhelms = [
  "Paul Rose",
  "Rob Powell",
  "Gordon Stewart",
  "Finn Guiliani",
  "Matt Davies",
  "David O'Shea",
  "Matt Gill",
  "Paul Coxhead",
  "Mike Gearing",
  "Roshan Bhumbra",
  "Christine Bunning",
  "Elizabeth Fisher",
  "Mike Clarke",
  "Jason Dryden",
  "Andrew Russell",
  "Chris Blade",
  "Krzysztof Bonicki",
  "Chris Tamlyn",
  "Rachel Croker",
  "Ray Skinner",
  "Mark Hobbs",
  "Joe Croker",
  "Nick Holmes",
  "Claire Martin",
  "Chris Gearing",
  "Jack Ginn",
  "George Capel",
  "Garry Cook",
  "Martin Croker",
  "Ron Pratt",
  "Paul Smith",
  "Len Soanes",
  "George Hann",
  "Tony Almond",
  "Graham Davies",
  "Mike Hann",
  "Chris Tamlyn",
  "Andy Everitt",
  "Sissens",
  "Peter Canfer",
  "Graham Davies",
  "Len Soanes",
  "Mark Bowen"
];

let nowDate = new Date(Date.UTC(2021, 0));
const MS_IN_DAY = 1000 * 86400;
const DAYS_IN_YEAR = 365; // ish

let helms = lotsofhelms
  .map((helm, key) => ({
    ...exampleHelm,
    name: helm,
    dateLastRaced: (new Date(nowDate - key * 7 * MS_IN_DAY)).toISOString(),
  }))
  .map(({dateLastRaced, ...rest}) => ({
    ...rest,
    daysSinceRaced: (nowDate - Date.parse(dateLastRaced)) / MS_IN_DAY,
  }));

let boats = [{
  class: "Laser/ILCA7",
  sailNo: 126120,
  clubBoat: false,
}];

let classes = [{
    name: "Laser/ILCA7",
    year: 2021,
    clubPY: 1096,
    ryaPY: 1100,
    spinnaker: "0",
    rig: "U",
    crew: 1,
    revision: 0,
  },
];

class Index {
   /*
   * data:
   * scoreFn: (score, obj) => score, where score in range [-1, 0] with zero perfect match
   */
  constructor(data, scoreFn = (score) => score) {
    this.data = data;
    const MIN_SCORE = -10000;
    this.runSearch = (input) =>  fuzzysort.go(
      input,
      this.data,
      {
        keys: ["name"],
        scoreFn: (a) => {
          if (a[0]?.score === undefined) {
            return MIN_SCORE;
          }
          // Pass normalised score in range [-1, 0] to user provided scoreFn
          return scoreFn(-a[0]?.score / MIN_SCORE, a.obj) * -MIN_SCORE;
        },
        threshold: MIN_SCORE + 1,
        allowTypo: true,
      });
  }

  search(input) {
    const results = this.runSearch(input);
    if (results) {
      return results.map(({obj}) => obj);
    }
  }

  update(id, mapObject) {
    let index = this.data.findIndex(({id: dataId}) => dataId === id);
    if (index === -1) {
      throw new Error("Invalid object id");
    }
    this.data[index] = mapObject(this.data[index]);
  }

  create(newObject) {
    this.data.push(newObject);
  }

  delete(id) {
    let initialLength = this.data.length;
    let filteredData = this.data.filter(({id: dataId}) => dataId !== id);
    if (initialLength !== filteredData.length + 1) {
      throw new Error("Only one object should've been removed from index");
    }
    this.data = filteredData;
  }
}

// Search for helms more easily if raced within last year
const helmsIndex = new Index(helms, (score, obj) => score - obj.daysSinceRaced > DAYS_IN_YEAR ? -0.1 : 0 );
const boatIndex = new Index(boats);

function App() {
  const [selectedItem, setSelectedItem] = useState(null)
  function handleSelectedItemChange({selectedItem}) {
    setSelectedItem(selectedItem);
    console.log(selectedItem);
  }

  return (
    <div>
      <Autocomplete
        label = {"Choose Helm"}
        data = {helmsIndex.data}
        itemToString = {(helm) => (helm ? helm.name : "")}
        filterData = {(inputValue) => helmsIndex.search(inputValue)}
        onSelectedItemChange = {handleSelectedItemChange}
      />
      <Autocomplete
        label = {"Choose Boat"}
        data = {helmsIndex.data}
        itemToString = {(helm) => (helm ? helm.name : "")}
        filterData = {(inputValue) => helmsIndex.search(inputValue)}
        onSelectedItemChange = {handleSelectedItemChange}
      />
    </div>
  );
}

export default App;
