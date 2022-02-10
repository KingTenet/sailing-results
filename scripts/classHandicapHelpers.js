
export function calculateClassCorrectedTime(PY, finishTime, lapsCompleted, lapsToUse) {
    return lapsCompleted ? finishTime * lapsToUse * 1000 / (lapsCompleted * PY) : undefined;
}
