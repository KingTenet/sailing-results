
export function calculateClassCorrectedTime(PY, finishTime, lapsCompleted, lapsToUse) {
    return lapsCompleted ? finishTime * lapsToUse * 1000 / (lapsCompleted * PY) : undefined;
}

export function calculatePersonalInterval(classCorrectedTime, standardCorrectedTime) {
    return (classCorrectedTime / standardCorrectedTime - 1) * 100;
}