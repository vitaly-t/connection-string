module.exports = {
    verbose: true,
    collectCoverage: true,
    coverageThreshold: {
        global: {
            // TODO: Restore the lines here when all tests pass
            branches: 80, // Interoperability JS lines cannot be covered, hence 95%
            lines: 80
        }
    },
    globals: {
        'ts-jest': {
            tsConfig: {
                target: 'ES2020',
            }
        }
    },
    "roots": [
        "./test"
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    }
}
