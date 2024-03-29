import React, { useState } from "react";

import { useAppState, useServices } from "../useAppState";
import StoreRace from "../store/types/Race";
import Result from "../store/types/Result";
import Helm from "../store/types/Helm";
import AlertDialogWrapper from "./AlertDialogWrapper";
import HelmResult from "../store/types/HelmResult";


export default function CommitResultsDialog({ race, onSuccess, onFailed, onStarted, children }) {
    const [appState, updateAppState] = useAppState();
    const services = useServices();
    const [committing] = useState(false);

    const raceRegistered = appState.registered.filter((result) => HelmResult.getRaceId(result) === StoreRace.getId(race));
    const raceResults = appState.results.filter((result) => Result.getRaceId(result) === StoreRace.getId(race));
    const raceOODs = appState.oods.filter((ood) => HelmResult.getRaceId(ood) === StoreRace.getId(race));
    const allNewHelms = appState.newHelms;
    const [isPursuitRace] = useState(() => services.isPursuitRace(race));

    const mappedRaceResults =
        isPursuitRace
            ? [...raceResults, ...raceRegistered.map((result, positionIndex) => Result.fromRegistered(result, positionIndex + 1))]
            : raceResults;

    const asyncCommitNewHelms = async () => {
        if (committing) {
            return;
        }
        return services
            .commitNewHelmsForResults(race, mappedRaceResults, raceOODs, allNewHelms)
            .then((helmIdsRemoved) =>
                updateAppState(({ newHelms, ...state }) => ({
                    ...state,
                    newHelms: newHelms.filter((newHelm) => !helmIdsRemoved.includes(Helm.getId(newHelm))),
                }))
            );
    };

    const asyncCommitResults = async () => {
        if (committing) {
            return;
        }

        return services
            .commitResultsForRace(race, mappedRaceResults, raceOODs)
            .then(() => services.reprocessStoredResults())
            .then(() => {
                updateAppState(({ results, registered, oods, ...state }) => ({
                    ...state,
                    // TODO need to test this is correctly removed (safer to use ID lookups)
                    registered: registered.filter((registered) => !raceRegistered.includes(registered)),
                    results: results.filter((result) => !raceResults.includes(result)),
                    oods: oods.filter((ood) => !raceOODs.includes(ood))
                }))
            })
            .then(() => onSuccess())
    };


    const commitResults = () => {
        if (committing) {
            return;
        }
        onStarted();
        asyncCommitNewHelms()
            .then(() => asyncCommitResults())
            .catch((err) => onFailed(err));
    };

    return (
        <AlertDialogWrapper
            onConfirm={() => commitResults()}
            deleteHeading={
                raceOODs.length ? `Are you sure you want to commit results?`
                    : `No OODS have been registered. Are you sure you want to commit results?`}
            confirmButtonText={"Commit results"}
        >
            {children}
        </AlertDialogWrapper>
    );
}