
import React from "react";
import { useAppState } from "../useAppState";
import HelmResult from "../store/types/HelmResult";
import AlertDialogWrapper from "./AlertDialogWrapper";

export function DeleteFinisher({ finisher, children }) {
    const [, updateAppState] = useAppState();

    const deleteFinisher = () => {
        updateAppState(({ results, ...state }) => ({
            ...state,
            results: results.filter((result) => HelmResult.getId(result) !== HelmResult.getId(finisher)),
        }));
    };

    return (
        <AlertDialogWrapper
            onConfirm={() => deleteFinisher()} deleteHeading={`Delete result for ${HelmResult.getHelmId(finisher)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

export function DeletePursuitFinish({ registeredToDelete, children }) {
    const [, updateAppState] = useAppState();

    const deletePursuitFinish = () => {
        updateAppState(({ registered, ...state }) => ({
            ...state,
            registered: registered.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(registeredToDelete)),
        }));
    };

    return (
        <AlertDialogWrapper
            onConfirm={() => deletePursuitFinish()} deleteHeading={`Delete helm: ${HelmResult.getHelmId(registeredToDelete)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

export function DeleteOOD({ ood, children }) {
    const [, updateAppState] = useAppState();

    const deleteOOD = () => {
        updateAppState(({ oods, ...state }) => ({
            ...state,
            oods: oods.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(ood)),
        }));
    };

    return (
        <AlertDialogWrapper
            onConfirm={() => deleteOOD()} deleteHeading={`Delete OOD: ${HelmResult.getHelmId(ood)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}