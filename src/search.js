import fuzzysort from "fuzzysort";

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
}

export const search = {
    // Search for helms more easily if raced within last year
    helmsIndex: new Index(helms, "name", (score, obj) => score - obj.daysSinceRaced > DAYS_IN_YEAR ? -0.1 : 0 ),
    boatsIndex: new Index(boats, "class"),
}