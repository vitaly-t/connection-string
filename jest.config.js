module.exports = {
    verbose: true,
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 95,
            lines: 100,
        }
    },
    roots: [
        './test',
    ],
    testMatch: [
        '**/?(*.)+(spec|test).+(ts|tsx|js)',
        '**/__tests__/**/*.+(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: {
                    target: 'ES2020',
                    esModuleInterop: true
                }
            }
        ]
    }
}
