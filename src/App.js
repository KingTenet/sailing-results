import { Box, Flex, Text } from "@chakra-ui/react";
import { Link, useRoutes, Navigate } from "react-router-dom";
// import { BrowserRouter as Router } from "react-router-dom";
import { HashRouter as Router } from "react-router-dom";
import React from "react";

import { useAppState } from "./useAppState";

import StateWrapper from "./StateWrapper";
import Races from "./components/Races";
import Race from "./components/Race";
import RegisterHelm from "./components/RegisterHelm";
import FinishHelm from "./components/FinishHelm";
import RegisterOOD from "./components/RegisterOOD";

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
                { path: '/races/:raceDate/:raceNumber', element: <Race /> },
                { path: '/races/:raceDate/:raceNumber/register', element: <RegisterHelm /> },
                { path: '/races/:raceDate/:raceNumber/ood', element: <RegisterOOD /> },
                { path: '/races/:raceDate/:raceNumber/fleetFinish/:registered', element: <FinishHelm isPursuit={false} /> },
                { path: '/races/:raceDate/:raceNumber/pursuitFinish/:registered', element: <FinishHelm isPursuit={true} /> },
            ]
        },
        { path: '/*', element: <Navigate to="/races" /> },
    ]);

    return element
}

function App() {
    return (
        <Router>
            <MyRoutes />
        </Router>
    )
}

export default App;