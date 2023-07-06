/*
a "combination" is a data structure containing a list of all the combinations of things.
each "combination" is a list, structured as follows:
each item in this list coresponds to a course
this "item" is itself a list, containing a list of numbers
with each number representing the chosen thing for a given group

eg. for CS1P, CS1S, and CS1F:
[[0, 0, 3], [0, 0, 0, 9], [0, 1, 0]]
this effectively means
[[enrollment0, lect0, lab3], [enrollment0, lect0, lab0, tutorial9], [enrollment0, lect1, lab0]]

(note that this example is not representative of the actual structure of these courses)
*/

// helper functions initially created for helping generate combinations
export function zeroCombination(combination)
{
	let zeroComb = []
	for (let clss of combination)
	{
		let subComb = []

		for (let group of clss)
		{
			let obj = new Object();
			obj.itemIndex = 0;
			obj.length = group.length

			subComb.push(obj)
		}

		zeroComb.push(subComb)
	}
	return zeroComb
}

export function compareCombination(comb1, comb2)
{
	if (comb1.length !== comb2.length) return false

	for (let clss_i = 0 ; clss_i < comb1.length ; clss_i++)
	{
		if (comb1[clss_i].length !== comb2[clss_i].length) return false

		for (let group_i = 0 ; group_i < comb1[clss_i].length ; group_i++)
		{
			let obj1 = comb1[clss_i][group_i]
			let obj2 = comb2[clss_i][group_i]

			if (obj1.itemIndex !== obj2.itemIndex || obj1.length !== obj2.length) return false
		}
	}
	return true
}

export function deepCopyCombination(combination)
{
	let newComb = []
	for (let clss of combination)
	{
		let subComb = []

		for (let group of clss)
		{
			let obj = new Object();
			obj.itemIndex = group.itemIndex;
			obj.length = group.length

			subComb.push(obj)
		}

		newComb.push(subComb)
	}
	return newComb
}

export function createBaseCombination(chosenCourses)
{
	// building up the base combination
	let base_combination = []
	for (let course of chosenCourses)
	{
		let group_choices = []

		for (let group_key in course.classes)
		{
			let obj = new Object();
			obj.itemIndex = 0;
			obj.length = course.classes[group_key].length
			group_choices.push(obj)
		}
		base_combination.push(group_choices)
	}
	return base_combination
}

export function incrementAndPropagate(base_combination, courseI, groupI)
{
	// increment the item
	let course = base_combination[courseI] // obtain the course in question
	course[groupI].itemIndex += 1 // advance the selection for the apropriate group

	if (course[groupI].itemIndex > course[groupI].length-1) // if overflow detected...
	{
		course[groupI].itemIndex = 0 // reset to 0 (the OVERFLOW part)

		if (groupI > 0) // if not at last group yet...
			return incrementAndPropagate(base_combination, courseI, groupI-1) // PROPOGATE to next group
		else
		{
			if (courseI <= 0) return zeroCombination(base_combination)// return a base_combination that has all zeroes. this will signify to the caller that the combination has hit the final overflow and we are done.

			let nextCourse = base_combination[courseI-1]
			//let firstGroup = nextCourse[nextCourse.length-1]
			return incrementAndPropagate(base_combination, courseI-1, nextCourse.length-1) // PROPOGATE to first group in next course
		}
	}

	return base_combination
}

export function generateCombinations(chosenCourses)
{
	let base_combination = createBaseCombination(chosenCourses)
	let original_base_combination = zeroCombination(base_combination)

	let combinations = []
	//  we repeatedly increment the values representing the chosen things, until the value overruns and loops back to 0 once it reaches the number of selectables in the given group.
	while (true)
	{
		let last_classI = base_combination.length-1
		let last_groupI = base_combination[last_classI].length-1
		base_combination = incrementAndPropagate(base_combination, last_classI, last_groupI)

		combinations.push(deepCopyCombination(base_combination))

		// if everything is 0 again, that means the combination has fully overflowed and we have looped back and are ready to break & continue w the rest of the program (note that this is also why we seem to skip the step of adding the first combination. (it gets added at the end))
		if (compareCombination(base_combination, original_base_combination))
			break
	}

	return combinations
}
