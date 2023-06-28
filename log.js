// Log levels:
// verbose                     3
ogcnsll = console.log;      // 2
ogcnslw = console.warn;     // 1
ogcnsle = console.error;    // 0

// Only show errors by default
var logLevel = 0;

console.log = (...a) => {
    if (logLevel < 2) return
    ogcnsll(...a);
}

console.warn = (...a) => {
    if (logLevel < 1) return
    ogcnslw(...a);
}

console.error = (...a) => {
    ogcnsle(...a);
}

console.verbose = (...a) => {
    if (logLevel < 3) return
    ogcnsll(...a);
}

module.exports = {
    setLogLevel: (ll) => {
        logLevel = ll;
    }
}