import { Box, Flex, Text } from "@chakra-ui/react";
import { BrowserRouter as Router, Link, useRoutes, Navigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

import AddHelmResult from "./AddHelmResult";
import { useAppState, AppContext } from "./useAppState";
import StateWrapper from "./StateWrapper";
import { getURLDate } from "./common"

function Race() {
    const [appState] = useAppState();
    const params = useParams();

    const raceDate = appState?.store?.raceDate;
    const races = appState?.store?.activeRaces;
    const raceNumber = params["raceNumber"]

    if (!races || !raceDate || !raceNumber) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>Home</Text>
                <Text>Race</Text>
            </Flex>
            <Text>{`Update ${getURLDate(raceDate)}, race ${raceNumber}`}</Text>
            <Flex direction="column">
                <Link to="register">Register helm</Link>
                <Link to="finish">Finish helm</Link>
            </Flex>
        </>
    )
}

function RaceDate() {
    const [appState] = useAppState();
    const params = useParams();

    const raceDate = appState?.store?.raceDate;
    const races = appState?.store?.activeRaces;
    const raceNumber = params["raceNumber"]

    if (!races || !raceDate || !raceNumber) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>Home</Text>
                <Text>Race</Text>
            </Flex>
            <Text>{`Update ${getURLDate(raceDate)}, race ${raceNumber}`}</Text>
            <Flex direction="column">
                <Link to="register">Register helm</Link>
                <Link to="finish">Finish helm</Link>
            </Flex>
        </>
    )
}

function Home() {
    const [appState] = useAppState();

    if (!appState) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>Home</Text>
            </Flex>
            <Box>
                <Link to="races/">Update Races</Link>
            </Box>
        </>
    )
}

function Races() {
    console.log("Rendering Races");
    const [appState] = useAppState();

    const raceDate = appState?.store?.raceDate;
    const races = appState?.store?.activeRaces;

    if (!races || !raceDate) {
        return (
            <>
            </>
        )
    }

    return (
        <>
            <Flex direction="row" width="100vh" justify={"space-between"}>
                <Text>{`Races for ${getURLDate(raceDate)}`}</Text>
            </Flex>
            <Box>
                {races && races.map(({ raceNumber }) => (
                    <Link to={`${getURLDate(raceDate)}/${raceNumber}`}>{`Update Race ${raceNumber}`}</Link>
                ))}
            </Box>
        </>
    )
}

/*
In the backend, series need to be preconfigured line items.
Season  Series  Date        Race
21/22   Icicle  23/01/2022  1
21/22   Icicle  23/01/2022  2
21/22   Icicle  23/01/2022  3

21/22   Icicle  30/01/2022  1
21/22   Icicle  30/01/2022  2
21/22   Icicle  30/01/2022  3

2022    Icicle  30/01/2022  1
2022    Icicle  30/01/2022  2
2022    Icicle  30/01/2022  3

2022    Icicle  30/01/2022  1
2022    Icicle  30/01/2022  2
2022    Icicle  30/01/2022  3

Races can exist in multiple series, but they will use the same results.
Therefore Series/Seasons can be created retrospectively.

Or just allow a series/season/race to be created dynamically based on the URL?

Race results stored in backend as date, name (eg. 1) only.
30/01/2022  1   Rob Radial   126120 42:30
30/01/2022  1
30/01/2022  1
30/01/2022  2
30/01/2022  3

Separately a mapping is stored between race dates and series/season.
2022    Icicle  30/01/2022
*/

/*
/race/:date/:race/
/race/:date/:race/sign-on
/race/:date/:race/sign-on/helm?name=dave
/race/:date/:race/sign-on/boat?sail-no=1234
/race/:date/:race/sign-on/boat/class?class=rs2000
/race/:date/:race/finish?helm=blah

/season/:season
/season/:season/:series

*/
function MyRoutes() {
    let element = useRoutes([
        {
            path: '/', element: <StateWrapper />, children: [
                { path: '/', element: <Home />, index: true },
                { path: '/races/', element: <Races /> },
                { path: '/races/:raceDate', element: <RaceDate /> },
                { path: '/races/:raceDate/:raceNumber', element: <Race /> },
                { path: '/races/:raceDate/:raceNumber/register', element: <AddHelmResult /> },
            ]
        },
        { path: '/*', element: <Navigate to="/races" /> },
    ]);

    return element
}

function App() {
    const appStateManager = useState();

    return (
        <AppContext.Provider value={appStateManager}>
            <Router>
                <MyRoutes />
            </Router>
        </AppContext.Provider>
    )
}

export default App;