import inspector from 'node:inspector';
import denormalize from './denormalizeSailwave.js';

if (inspector.url()) {
    console.log("Waiting...");
    inspector.waitForDebugger();
}

try {
    denormalize(...process.argv.slice(2));
} catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(1);
}