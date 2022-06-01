import { Box, Flex, Text } from "@chakra-ui/react";
import { Link, useRoutes, Navigate } from "react-router-dom";
// import { BrowserRouter as Router } from "react-router-dom";
import { HashRouter as Router } from "react-router-dom";
import React, { useEffect } from "react";

import { useAppState } from "./useAppState";

import StateWrapper from "./StateWrapper";
import Races from "./components/Races";
import Race from "./components/Race";
import RegisterHelm from "./components/RegisterHelm";
import FinishHelm from "./components/FinishHelm";
import RegisteredHelm from "./components/RegisteredHelm";
import RegisterOOD from "./components/RegisterOOD";
import Series from "./components/Series";
import { useNavigate } from "react-router-dom";
import SeriesPoints from "./components/SeriesPoints";
import { useServices } from "./useAppState";
import RegisterAnotherButtons from "./components/RegisterAnotherButtons";

const ADD_ANOTHER_HELM_WORKFLOW = true;

function Home() {
    const [appState] = useAppState();
    const services = useServices();

    let navigate = useNavigate();

    useEffect(() => {
        if (appState) {
            console.log(services.readOnly);
            if (!services.readOnly) {
                navigate("races/");
            }
            else {
                navigate("series/");
            }
        }
    }, [appState]);

    if (!appState || !services) {
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

function MyRoutes() {
    let element = useRoutes([
        {
            path: '/', element: <StateWrapper />, children: [
                { path: '/', element: <Home />, index: true },
                { path: '/races/', element: <Races liveOnly={true} /> },
                { path: '/races/:raceDate/:raceNumber', element: <Race backButtonText="Back to races" /> },
                { path: '/races/:raceDate/:raceNumber/register', element: <RegisterHelm addAnotherHelmWorkflow={ADD_ANOTHER_HELM_WORKFLOW} /> },
                { path: '/races/:raceDate/:raceNumber/registerAnother/:registered', element: <RegisteredHelm><RegisterAnotherButtons /></RegisteredHelm> },
                { path: '/races/:raceDate/:raceNumber/ood', element: <RegisterOOD /> },
                { path: '/races/:raceDate/:raceNumber/fleetFinish/:registered', element: <RegisteredHelm><FinishHelm /></RegisteredHelm> },
                { path: '/races/:raceDate/:raceNumber/pursuitFinish/:registered', element: <RegisteredHelm><FinishHelm /></RegisteredHelm> },
                { path: '/series/', element: <Series /> },
                { path: '/series/:season/:series', element: <SeriesPoints /> },
                { path: '/series/:season/:series/:raceDate/:raceNumber', element: <Race backButtonText="Back to series" /> },
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