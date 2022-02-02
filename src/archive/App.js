import React, { useEffect } from "react";
import {useState} from "react";
import './App.css';
import {Center, Spinner} from '@chakra-ui/react';

const appState = {
  races: [

  ],
  helms: [

  ],
  boats: [

  ],
  classes: [

  ],
  season: "2021-2022",
  series: "Icicle",
  raceDate: "2022-01-23",

};

const encode = (data) => JSON.stringify(data);
const unencode = (data) => JSON.parse(data);

const encToken = encode({
  apikey: "abcdef",
  season: "2021-2022",
  series: "Icicle",
  raceDate: "2022-01-23"
});

const loadToken = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(unencode(encToken)), 100);
  })
}

const loadRemoteState = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(unencode(encToken)), 100);
  })
}

function App({}) {
  const [appState, updateAppState] = useState();
  const [token, updateToken] = useState();

  useEffect(() => {
    if (!token) {
      loadToken.then(updateToken);
    }
    
    if (!appState && token) {
      loadRemoteState.then(([helms, boats, classes]) => {
        updateAppState({
          races: [],
          helms: helms,
          boats: boats,
          classes: classes,
          season: token.season,
          series: token.series,
          raceDate: token.raceDate,
        });
      });
    }
  })

  return (
    <Center height="80vh" width="100%">
      {!appState && 
        <Spinner/>
      }
    </Center>
  );
}

export default App;
