import { useRoutes, Navigate, useLocation, matchRoutes, Outlet } from "react-router-dom";
import { HashRouter as Router } from "react-router-dom";
import React, { useEffect, useState } from "react";

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
import { ForceSpinner } from "./components/Spinner";

import './styles.css';

const ADD_ANOTHER_HELM_WORKFLOW = true;
const BOOTSTRAP_HISTORY = true;

function Home() {
    const [appState] = useAppState();
    const services = useServices();

    let navigate = useNavigate();

    useEffect(() => {
        if (appState) {
            console.log(services.readOnly);
            if (!services.readOnly) {
                navigate("races");
            }
            else {
                navigate("series");
            }
        }
    }, [appState]);

    return (
        <></>
    )
}

function NavWrapper() {
    return <Outlet />
}

const ROOT_PATHNAME = "/";
const ROUTES = [
    {
        path: ROOT_PATHNAME, element: <StateWrapper />, children: [
            { path: ROOT_PATHNAME, element: <Home />, index: true },
            {
                path: '/races/', element: <NavWrapper />, children: [
                    { path: '/races/', element: <ForceSpinner>{() => <Races editableOnly={true} />}</ForceSpinner>, index: true },
                    {
                        path: '/races/:raceDate/:raceNumber', element: <NavWrapper />, children: [
                            { path: '/races/:raceDate/:raceNumber', element: <ForceSpinner>{() => <Race backButtonText="Back to races" />}</ForceSpinner>, index: true },
                            { path: '/races/:raceDate/:raceNumber/register', element: <ForceSpinner>{() => <RegisterHelm addAnotherHelmWorkflow={ADD_ANOTHER_HELM_WORKFLOW} />}</ForceSpinner> },
                            { path: '/races/:raceDate/:raceNumber/registerAnother/:registered', element: <ForceSpinner>{() => <RegisteredHelm><RegisterAnotherButtons /></RegisteredHelm>}</ForceSpinner> },
                            { path: '/races/:raceDate/:raceNumber/ood', element: <ForceSpinner>{() => <RegisterOOD />}</ForceSpinner> },
                            { path: '/races/:raceDate/:raceNumber/fleetFinish/:registered', element: <ForceSpinner>{() => <RegisteredHelm backHeading="Finish Helm"><FinishHelm /></RegisteredHelm>}</ForceSpinner> },
                        ]
                    }
                ]
            },
            {
                path: '/series/', element: <NavWrapper />, children: [
                    { path: '/series/', element: <Series />, index: true },
                    {
                        path: '/series/:season/:series', element: <NavWrapper />, children: [
                            { path: '/series/:season/:series', element: <SeriesPoints />, index: true },
                            { path: '/series/:season/:series/:raceDate/:raceNumber', element: <Race backButtonText="Back to series" /> },
                        ]
                    }
                ]
            },
        ]
    },
    { path: '/*', element: <Navigate to="/" /> },
];

function MyRoutes() {
    let element = useRoutes(ROUTES);

    return element
}

/**
 * This component pushes each required URL into the history stack to allow navigation to be hierarchical.
 * State must be passed in from outside Router due to re-mounting on location updates
 */
function NavigationWrapper({ navStack, updateNavStack, next, index }) {
    const location = useLocation();
    const navigate = useNavigate();

    const stripTrailingSlash = (str) => str.at(-1) === "/" ? str.slice(0, -1) : str;
    const isReady = navStack && index >= navStack.length;

    useEffect(() => {
        if (isReady) {
            return;
        }
        if (navStack === undefined) {
            const targetMatches = matchRoutes(ROUTES, location);
            const targetMatchParents = targetMatches && targetMatches
                .filter((match) => match?.route?.children)
                .filter((match) => stripTrailingSlash(match.pathname) !== stripTrailingSlash(location.pathname)) // Exclude current location
                .filter((match) => match.pathname !== ROOT_PATHNAME); // Exclude root path from navigation because it redirects and confuses things

            updateNavStack([...targetMatchParents, location]);
        }
    }, []);

    useEffect(() => {
        if (isReady || !navStack) {
            return;
        }
        const nextLocation = navStack[index];
        navigate(nextLocation, { replace: !index });
    }, [navStack, index]);

    useEffect(() => {
        if (isReady || !navStack) {
            return;
        }
        next();
    }, [location]);

    if (!isReady) {
        return <></>
    }

    return <MyRoutes />
}


function App() {
    const [navStack, updateNavStack] = useState();
    const [index, updateIndex] = useState(0);

    if (BOOTSTRAP_HISTORY) {
        return (
            <Router>
                <NavigationWrapper navStack={navStack} updateNavStack={updateNavStack} next={() => updateIndex((prev) => prev + 1)} index={index} />
            </Router>
        )
    }

    return (
        <Router>
            <MyRoutes />
        </Router>
    )
}

export default App;