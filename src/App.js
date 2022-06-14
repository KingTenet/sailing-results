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
                    { path: '/races/', element: <Races editableOnly={true} />, index: true },
                    {
                        path: '/races/:raceDate/:raceNumber', element: <NavWrapper />, children: [
                            { path: '/races/:raceDate/:raceNumber', element: <Race backButtonText="Back to races" />, index: true },
                            { path: '/races/:raceDate/:raceNumber/register', element: <RegisterHelm addAnotherHelmWorkflow={ADD_ANOTHER_HELM_WORKFLOW} /> },
                            { path: '/races/:raceDate/:raceNumber/registerAnother/:registered', element: <RegisteredHelm><RegisterAnotherButtons /></RegisteredHelm> },
                            { path: '/races/:raceDate/:raceNumber/ood', element: <RegisterOOD /> },
                            { path: '/races/:raceDate/:raceNumber/fleetFinish/:registered', element: <RegisteredHelm><FinishHelm /></RegisteredHelm> },
                            { path: '/races/:raceDate/:raceNumber/pursuitFinish/:registered', element: <RegisteredHelm><FinishHelm /></RegisteredHelm> },
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
function NavigationWrapper({ navStack, updateNavStack, updateTargetPath, targetPath, isReady, updateIsReady }) {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (isReady) {
            return;
        }

        if (!targetPath) {
            updateTargetPath(location);
        }
    }, []);

    useEffect(() => {
        if (isReady || !targetPath) {
            return;
        }
        if (navStack === undefined) {
            const targetMatches = matchRoutes(ROUTES, location);
            const targetMatchParents = targetMatches && targetMatches
                .filter((match) => match?.route?.children)
                .filter((match) => match.pathnameBase !== targetPath.pathname);
            if (targetMatchParents.length) {
                updateNavStack(targetMatchParents.reverse());
            }
            else {
                updateIsReady(true);
            }
        }
    }, [targetPath]);

    useEffect(() => {
        if (isReady) {
            return;
        }
        if (navStack && navStack.length && navStack.at(-1).pathnameBase === location.pathname) {
            updateNavStack((prev) => {
                const newNavStack = [...prev].slice(0, -1);
                return newNavStack;
            });
        }
        else if (targetPath && navStack && !navStack.length && targetPath.pathname === location.pathname) {
            updateIsReady(true);
        }
    }, [location]);

    useEffect(() => {
        if (isReady) {
            return;
        }
        if (navStack) {
            if (navStack.length) {
                const nextLocation = [...navStack].pop();
                navigate(nextLocation, { replace: nextLocation.pathname === ROOT_PATHNAME });
            }
            else {
                navigate(targetPath);
            }
        }
    }, [navStack]);

    if (!isReady) {
        return <></>
    }

    return <MyRoutes />
}


function App() {
    const [navStack, updateNavStack] = useState();
    const [targetPath, updateTargetPath] = useState();
    const [isReady, updateIsReady] = useState(false);

    if (BOOTSTRAP_HISTORY) {
        return (
            <Router>
                <NavigationWrapper navStack={navStack} updateNavStack={updateNavStack} targetPath={targetPath} updateTargetPath={updateTargetPath} isReady={isReady} updateIsReady={updateIsReady} />
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