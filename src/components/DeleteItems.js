import React, { useState } from "react";
import { useAppState } from "../useAppState";
import HelmResult from "../store/types/HelmResult";
import AlertDialogWrapper from "./AlertDialogWrapper";

import { useDisclosure } from "@chakra-ui/react";
import { useLongPressHandler } from "../common/hooks";

export function DeleteFinisher({ itemToDelete: finisher, providedDisclosure, children }) {
    const [, updateAppState] = useAppState();

    const deleteFinisher = () => {
        updateAppState(({ results, ...state }) => ({
            ...state,
            results: results.filter((result) => HelmResult.getId(result) !== HelmResult.getId(finisher)),
        }));
    };

    return (
        <AlertDialogWrapper
            providedDisclosure={providedDisclosure}
            onConfirm={() => deleteFinisher()} deleteHeading={`Delete result for ${HelmResult.getHelmId(finisher)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

export function DeletePursuitFinish({ itemToDelete: registeredToDelete, providedDisclosure, children }) {
    const [, updateAppState] = useAppState();

    const deletePursuitFinish = () => {
        updateAppState(({ registered, ...state }) => ({
            ...state,
            registered: registered.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(registeredToDelete)),
        }));
    };

    return (
        <AlertDialogWrapper
            providedDisclosure={providedDisclosure}
            onConfirm={() => deletePursuitFinish()} deleteHeading={`Delete helm: ${HelmResult.getHelmId(registeredToDelete)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

export function DeleteOOD({ itemToDelete: ood, providedDisclosure, children }) {
    const [, updateAppState] = useAppState();

    const deleteOOD = () => {
        updateAppState(({ oods, ...state }) => ({
            ...state,
            oods: oods.filter((prev) => HelmResult.getId(prev) !== HelmResult.getId(ood)),
        }));
    };

    return (
        <AlertDialogWrapper
            providedDisclosure={providedDisclosure}
            onConfirm={() => deleteOOD()} deleteHeading={`Delete OOD: ${HelmResult.getHelmId(ood)}.`}>
            {children}
        </AlertDialogWrapper>
    )
}

export function DeleteItemOnLongPress({ DeleteItemComponent, ListItemComponent, onClick, item, children, ...props }) {
    const { onOpen, ...providedDisclosure } = useDisclosure();
    const longPressProps = useLongPressHandler(
        onClick,
        onOpen,
    );

    return (
        <DeleteItemComponent
            providedDisclosure={providedDisclosure}
            itemToDelete={item}
        >
            <ListItemComponent
                item={item}
                {...longPressProps}
                {...props}
            />
        </DeleteItemComponent>
    );
}

export function wrapDeleteOnLongPress(DeleteItemComponent, ListItemComponent, getProps = () => ({})) {
    return ({ item, ...innerProps }) => <DeleteItemOnLongPress
        DeleteItemComponent={DeleteItemComponent}
        ListItemComponent={ListItemComponent}
        item={item}
        {...getProps(item)}
        {...innerProps}
    />
}