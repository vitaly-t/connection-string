module.exports = {
    verbose: true,
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 95, // Interoperability JS lines cannot be covered, hence 95%
            lines: 100
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
