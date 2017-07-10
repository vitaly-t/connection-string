'use strict';

// Automatic links:
var links = {
    'something': 'bla-bla'
};

function fixLinks(source) {
    return source.replace(/\$\[[a-z0-9\s/+-.]+\]/gi, function (name) {
        var sln = name.replace(/\$\[|\]/g, ''); // stripped link name;
        if (sln in links) {
            return '<a href="' + links[sln] + '">' + sln + '</a>';
        }
        return name;
    });
}

module.exports = fixLinks;
