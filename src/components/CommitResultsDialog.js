export default function CommitResultsDialog({ race, onSuccess, onFailed, onStarted, children }) {
    const [appState, updateAppState] = useAppState();
    const services = useServices();
    const [committing] = useState(false);

    const raceResults = appState.results.filter((result) => Result.getRaceId(result) === StoreRace.getId(race));
    const raceOODs = appState.oods.filter((ood) => Result.getRaceId(ood) === StoreRace.getId(race));
    const allNewHelms = appState.newHelms;

    const asyncCommitNewHelms = async () => {
        if (committing) {
            return;
        }
        return services
            .commitNewHelmsForResults(race, raceResults, raceOODs, allNewHelms)
            .then((helmIdsRemoved) =>
                updateAppState(({ newHelms, ...state }) => ({
                    ...state,
                    newHelms: newHelms.filter((newHelm) => !helmIdsRemoved.includes(Helm.getId(newHelm))),
                }))
            )
            .catch((err) => onFailed(err));
    };

    const asyncCommitResults = async () => {
        if (committing) {
            return;
        }
        return services
            .commitFleetResultsForRace(race, raceResults, raceOODs)
            .then(() =>
                updateAppState(({ results, oods, ...state }) => ({
                    ...state,
                    // TODO need to test this is correctly removed (safer to use ID lookups)
                    results: results.filter((result) => !raceResults.includes(result)),
                    oods: oods.filter((ood) => !raceOODs.includes(ood))
                }))
            )
            .then(() => services.reprocessStoredResults())
            .then(() => onSuccess())
            .catch((err) => onFailed(err))
    };


    const commitResults = () => {
        if (committing) {
            return;
        }
        onStarted();
        asyncCommitNewHelms()
            .then(() => asyncCommitResults());
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