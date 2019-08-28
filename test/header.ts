import chai from 'chai';
import {describe} from 'mocha';

const chaiDeepMatch = require('chai-deep-match');

chai.use(chaiDeepMatch);

const expect = chai.expect;

export {describe, expect, chai};
