import React, { useState } from "react";
import { useAppState } from "../useAppState";
import HelmResult from "../store/types/HelmResult";
import AlertDialogWrapper from "./AlertDialogWrapper";

import { useDisclosure } from "@chakra-ui/react";
import { useLongPressHandler } from "../common/hooks";
import MutableRaceResult from "../store/types/MutableRaceResult";
import { useNavigate } from "react-router-dom";

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

export function DeleteItemOnSwipe({ DeleteItemComponent, ListItemComponent, item, children, ...props }) {
    const { onOpen, ...providedDisclosure } = useDisclosure();

    return (
        <DeleteItemComponent
            providedDisclosure={providedDisclosure}
            itemToDelete={item}
        >
            <ListItemComponent
                item={item}
                onDelete={onOpen}
                {...props}
            />
        </DeleteItemComponent>
    );
}

export function ResetTimingComponent({ onResetFinisher, itemToReset, providedDisclosure, children }) {
    return (
        <AlertDialogWrapper
            providedDisclosure={providedDisclosure}
            deleteHeading={`Reset Timing for ${HelmResult.getHelmId(itemToReset)}.`}
            confirmButtonText="Reset"
            confirmColorScheme="blue"
            warningText="Are you sure? This action cannot be undone."
            onConfirm={() => onResetFinisher(itemToReset)}
        >
            {children}
        </ AlertDialogWrapper>
    )
}

export function ResetTimingOnClick({ ListItemComponent, item, onResetFinisher, children, ...props }) {
    const { onOpen, ...providedDisclosure } = useDisclosure();

    return (
        <ResetTimingComponent
            providedDisclosure={providedDisclosure}
            itemToReset={item}
            onResetFinisher={onResetFinisher}
        >
            <ListItemComponent
                item={item}
                onClick={onOpen}
                {...props}
            />
        </ResetTimingComponent>
    );
}

export function wrapDeleteOnSwipe(DeleteItemComponent, ListItemComponent, getProps = () => ({}), onResetFinisher) {
    const WrappedDeleteOnSwipe = ({ item, ...innerProps }) => <DeleteItemOnSwipe
        DeleteItemComponent={DeleteItemComponent}
        ListItemComponent={ListItemComponent}
        item={item}
        {...getProps(item)}
        {...innerProps}
    />;

    if (!onResetFinisher) {
        return WrappedDeleteOnSwipe;
    }

    return ({ item, ...innerProps }) => (
        <ResetTimingOnClick
            ListItemComponent={WrappedDeleteOnSwipe}
            onResetFinisher={onResetFinisher}
            item={item}
            {...getProps(item)}
            {...innerProps}
        />
    );
}
