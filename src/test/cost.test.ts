import assert from 'assert';
import { describe, it } from 'mocha';

import { calculateMillicredits } from '../main/utils/cost.js';

describe('Cost Calculation', () => {

    describe('calculateMillicredits', () => {
        const testScenarios = [
            { cost: 0.1, pricePerCredit: 0.01, expected: 10000 },
            { cost: 0.01, pricePerCredit: 0.01, expected: 1000 },
            { cost: 0.001, pricePerCredit: 0.01, expected: 100 },
            { cost: 0.0001, pricePerCredit: 0.01, expected: 10 },
            { cost: 0.00001, pricePerCredit: 0.01, expected: 1 },
            { cost: 0.000001, pricePerCredit: 0.01, expected: 1 },
            { cost: 0.0000001, pricePerCredit: 0.01, expected: 1 },
            { cost: 1, pricePerCredit: 0.01, expected: 100000 },
            { cost: 10, pricePerCredit: 0.01, expected: 1000000 },

            { cost: 0.1, pricePerCredit: 0.02, expected: 5000 },
            { cost: 0.01, pricePerCredit: 0.02, expected: 500 },
            { cost: 0.001, pricePerCredit: 0.02, expected: 50 },
            { cost: 0.0001, pricePerCredit: 0.02, expected: 5 },
            { cost: 0.00001, pricePerCredit: 0.02, expected: 1 },
            { cost: 0.000001, pricePerCredit: 0.02, expected: 1 },
            { cost: 0.0000001, pricePerCredit: 0.02, expected: 1 },
            { cost: 1, pricePerCredit: 0.02, expected: 50000 },

            // Edge cases
            { cost: 0, pricePerCredit: 0.01, expected: 0 },
            { cost: 1, pricePerCredit: 0, expected: 0 },

            // Different price points
            { cost: 0.05, pricePerCredit: 0.005, expected: 10000 },
            { cost: 0.05, pricePerCredit: 0.05, expected: 1000 },
            { cost: 0.05, pricePerCredit: 0.1, expected: 500 },
        ];

        for (const scenario of testScenarios) {
            it(`converts $${scenario.cost} to ${scenario.expected} millicredits (price per credit: $${scenario.pricePerCredit})`, () => {
                const result = calculateMillicredits(scenario.cost, scenario.pricePerCredit);
                assert.strictEqual(result, scenario.expected);
            });
        }

        it('handles string values for pricePerCredit', () => {
            const result = calculateMillicredits(0.1, '0.01' as any);
            assert.strictEqual(result, 10000);
        });

    });
});
