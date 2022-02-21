import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";


export const AppContext = React.createContext("AppContext");

export function useAppState(redirect = true) {
    const [appState, updateAppState] = useContext(AppContext);
    let navigate = useNavigate();
    useEffect(() => {
        console.log("In useAppState.useEffect");
        if (appState) {
            return;
        }
        else if (redirect) {
            console.log("Redirecting");
            navigate("/", { replace: true });
        }
    }, []);
    return [appState, updateAppState];
}
