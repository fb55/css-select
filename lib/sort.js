module.exports = sortByProcedure;

/*
	sort the parts of the passed selector,
	as there is potential for optimization
	(some types of selectors are faster than others)
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

function sortByProcedure(arr) {
    //TODO sort individual attribute selectors
    for (var i = 1; i < arr.length; i++) {
        var procOld = procedure[arr[i - 1].type],
            procNew = procedure[arr[i].type];

        if (procOld > procNew && procNew !== -1) {
            var tmp = arr[i];
            arr[i] = arr[i - 1];
            arr[i - 1] = tmp;
        }
    }
    return arr;
}
