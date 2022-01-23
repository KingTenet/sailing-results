import logo from './logo.svg';
import React from "react";
import {useState} from "react";
import fuzzysort from "fuzzysort";
import './App.css';
import Autocomplete from "./Autocomplete";

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
    group:"Cheese",
  }));

let boatExample = {
  class: "Laser/ILCA7",
  sailNo: 126120,
  clubBoat: false,
};

const boats = [...new Array(100)].map((val, key) => ({
  ...boatExample,
  class: `${boatExample.class}_${key}`,
  sailNumber: boatExample.sailNo + key,
  clubBoat: Boolean(key % 2),
}));

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
  constructor(data, name = "name", scoreFn = (score) => score) {
    this.data = data;
    const MIN_SCORE = -10000;
    this.runSearch = (input) =>  fuzzysort.go(
      input,
      this.data,
      {
        keys: [name],
        scoreFn: (result) => {
          // if (result?.obj && result.obj[name] === "New Item") {
          //   return MIN_SCORE + 1;
          // }

          if (result[0]?.score === undefined) {
            return MIN_SCORE;
          }
          // Pass normalised score in range [-1, 0] to user provided scoreFn
          return scoreFn(-result[0]?.score / MIN_SCORE, result.obj) * -MIN_SCORE;
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

  searchAndSort(input) {
    let results = this.search(input);
    if (results) {
      return results.sort((a, b) => {

      })
    }
  }

  // update(id, mapObject) {
  //   let index = this.data.findIndex(({id: dataId}) => dataId === id);
  //   if (index === -1) {
  //     throw new Error("Invalid object id");
  //   }
  //   this.data[index] = mapObject(this.data[index]);
  // }
  //
  // create(newObject) {
  //   this.data.push(newObject);
  // }
  //
  // delete(id) {
  //   let initialLength = this.data.length;
  //   let filteredData = this.data.filter(({id: dataId}) => dataId !== id);
  //   if (initialLength !== filteredData.length + 1) {
  //     throw new Error("Only one object should've been removed from index");
  //   }
  //   this.data = filteredData;
  // }
}

// Search for helms more easily if raced within last year
const helmsIndex = new Index(helms, "name", (score, obj) => score - obj.daysSinceRaced > DAYS_IN_YEAR ? -0.1 : 0 );
const boatIndex = new Index(boats, "class");

const label = "";
const helm = "";
const updateRaceDay = "";

function NewItem({onClick}) {
  return (
    <button type="button" onClick={onClick}>
      {`${label} &#8595`};
    </button>
  );
}

class ApplicationState {
  constructor() {
    this.data = {};
  }

  getData() {
    return this.data;
  }
}

class Race {
  constructor() {
    this.complete = false;
    this.raceResults = [
      {
        helm: helm,

      }
    ];
  }

  submitResults(results) {

  }
}


const raceDay = {
  date: "2021-12-09T00:00:00",
  series: "",
  races: [{}, {}, {}],
};

// function App() {
//   const [currentRaceDay, updateRaceDay] = useState(raceDay);

//   const onRaceDayUpdated = () => {
//     updateRaceDay((prevState) => ({
//       ...prevState,

//     }))
//   }

//   if (currentRaceDay) {
//     return <RaceDayOverview
//       raceDay={raceDay}
//       onRaceDayUpdated = {updateRaceDay}
//     />
//   }
//   return <RaceDaySelector/>
// }

// function RaceDaySelector(allDates) {
//   return <input type={"text"} value={"2021-12-09"}/>;
// }

// function RaceDayOverview({raceDay, onRaceDayUpdated}) {
//   const [selectedRace, updatedSelectedRace] = useState(undefined);

//   const onRaceUpdated = (raceInfo) => {
//     updateRaceDay(({races, ...prevState}) => ({
//       ...prevState,
//       races: races.map((race) => ({
//         ...race,
//       }))
//     }))
//   }

//   if (selectedRace !== undefined) {
//     return <RaceOverview
//       raceData={raceDay.races[selectedRace]}
//       onRaceUpdated
//     />
//   }
// }

// function RaceSelectors({raceDay, onSelect}) {
//   return (
//     <>
//       <h1>{raceDay.date}</h1>
//       {raceDay?.races && raceDay.races
//         .map(({race, key}) => (
//           <RaceButton
//             label = {`Race ${key}`}
//             onClick = {() => console.log()}
//           />
//         ))}
//     </>
//   );
// }

// function RaceButton({label, onClick}) {
//   return (
//     <div>
//       <input type={"button"} onClick={onClick}>
//         {label}
//       </input>
//     </div>
//   )
// }


function App2() {
  const [appState, setAppState] = useState({
    races: [],
  });

  const [currentView, updateCurrentView] = useState();

  const onRaceUpdated = (raceInfo) => {
    setAppState(({races, ...prevState}) => ({
      ...prevState,
      races: races.map((race) => ({
        ...race,
      }))
    }))
  }

  return <RaceInput onRaceUpdated={onRaceUpdated}/>
}


function RaceInput({onRaceUpdated}) {
  const [selectedHelm, setSelectedHelm] = useState(null);
  const [helmInput, setHelmInput] = useState(null);

  console.log(selectedHelm);
  // console.log(selectedBoat);

  return (
    <div style={{marginLeft:"100px", marginTop:"100px"}}>
      <form>
      <Autocomplete
        label = {"Choose Helm"}
        data = {helmsIndex.data}
        itemToString = {(helm) => (helm ? helm.name : "")}
        filterData = {(inputValue) => helmsIndex.search(inputValue)}
        handleSelectedHelmChange = {setSelectedHelm}
        // getNewItem = {newItem}
      />
      <Autocomplete
        label = {"Choose Helm"}
        data = {helmsIndex.data}
        itemToString = {(helm) => (helm ? helm.name : "")}
        filterData = {(inputValue) => helmsIndex.search(inputValue)}
        handleSelectedHelmChange = {setSelectedHelm}
        // getNewItem = {newItem}
      />
      <Autocomplete
        label = {"Choose Helm2"}
        data = {helmsIndex.data}
        itemToString = {(helm) => (helm ? helm.name : "")}
        filterData = {(inputValue) => helmsIndex.search(inputValue)}
        handleSelectedHelmChange = {setSelectedHelm}
        // getNewItem = {newItem}
      />
      </form>
      <NewItem
        label = {"New Helm"}
        onClick = {() => onRaceUpdated(selectedHelm)}
      />
    </div>
  );
}

function TextBox({value = ""}) {
  return (
    <>
      <input type={"text"} value={value} onChange={() => console.log()}/>
    </>
  )
}

function AddNewHelm({onSubmit}) {
  const [helmName, setHelmName] = useState(null);

  const addHelm = () => {
    onSubmit({
      name: helmName,
    })
  }

  const handleChange = (event) => {
    setHelmName(event.target.value);
  }

  return (
    <div>
      <input type={"text"} value={"blah"} onChange={handleChange}/>
      <input type={"button"} onClick={addHelm}>Submit</input>
    </div>
  )
}

export default App2;

