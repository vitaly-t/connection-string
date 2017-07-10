'use strict';

/**
 * @class ConnectionString
 */
function ConnectionString(str) {

    parse(str);

}

/*
* NOTES:
*
* 1) Should support client-side
*
* */

function parse(/*str*/) {

    // root type:
    var result = {
        protocol: 'postgres',
        user: 'vitaly',
        password: 'pass', // should support special symbols
        host: 'localhost',
        port: 12345,
        sections: ['database'], // all URL sections
        params: {
            // all URL parameters
            ssl: true
        }
    };

    return result;
}

module.exports = ConnectionString;
