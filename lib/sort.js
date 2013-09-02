module.exports = sortByProcedure;

/*
	sort the parts of the passed selector,
	as there is potential for optimization
*/
var procedure = {
    __proto__: null,
    universal: 5, //should be last so that it can be ignored
    tag: 3, //very quick test
    attribute: 1, //can be faster than class
    pseudo: 0, //can be pretty expensive (especially :has)

    //everything else shouldn't be moved
    descendant: -1,
    child: -1,
    sibling: -1,
    adjacent: -1
};

function procedureSorter(a, b) {
    return procedure[a.type] - procedure[b.type];
}

function sortByProcedure(arr) {
    //TODO optimize, sort individual attribute selectors
    var parts = [],
        last = 0,
        end = false;
    for (var i = 0, j = arr.length - 1; i <= j; i++) {
        if (procedure[arr[i].type] === -1 || (end = i === j)) {
            if (end) i++;
            parts = parts.concat(arr.slice(last, i).sort(procedureSorter));
            if (!end) last = parts.push(arr[i]);
        }
    }
    return parts;
}
