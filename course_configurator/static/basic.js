//let minCollisions = require('./timetabling_solver').minCollisions

/* general notes on this file:

a reminder of the json datastructure of the thing:

courses = [
    "code": "name",
    "title": "code",
    "classes": [
        "class": "class code",
        "section": "section title (eg lb01)",
        "status": status (closed/open/etc.),

        "meetings": [
                "time of occurance": <unix timestamp>,
                "duration": <duration>,
                "location": "room",
                "instructor": "instructor"
        ]
    ]
]

TODO: find a way to do this across multiple days (beeg oversight in planning when I decided to use that specific timetabler lol)
*/


// retrieve course data
fetch("/static/course_data/courses.json").then(function (response) {
	return response.json();
}).then(function (courses) {

	// some helper functions for working with the course data
	function courseCodeToObject(courseCode)
	{
		return courses.find(course => course.code === courseCode)
	}

	// note that an ID is expected to be structured as follows: "{course code}|{one of Lecture or Lab or Tutorial or etc.}|{class code}"
	function idToObject(id)
	{
		id = id.split("|")

		if (id.length < 1) return null
		let course = courseCodeToObject(id[0])

		if (id.length < 2) return course
		let group = course.classes[id[0] + "|" + id[1]] // groups are stored in a dictionary, with keys being of the form "{course code}|{one of Lecture or Lab or Tutorial or etc.}"

		if (id.length < 3) return group
		let courseClass = group.find(meeting => meeting.class === id[2])

		return courseClass
	}


	let chosenCourses = []
	let course = ""
	// collect chosen classes from user
	while (true)
	{
		course = window.prompt("enter course index (enter -1 to finish adding stuff)","-1"); // at this point we expect the user to be viewing the courses via dev tools
		if (course === "-1") { break; }
		course = courses[parseInt(course)]

		let classGroups = []
		// parse course to group up the interchangable things (group up different labs, different lectures, etc.)
		// this code operates on the assumption that all meetings which can be grouped together will begin with the same word
		for (let item of course.classes)
		{
			// keys are to be of the form "{course code}|{one of Lecture or Lab or Tutorial or etc.}"
			let key = course.code + "|" + item.section.split(" ")[0]
			if (key in classGroups) classGroups[key].push(item)
			else classGroups[key] = [item]
		}
		course.classes = classGroups // overwrite the original data with the grouped up structure
		chosenCourses.push(course)
	}

	console.log("chosenCourses:")
	console.log(chosenCourses)


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
	function zeroCombination(combination)
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

	function compareCombination(comb1, comb2)
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

	function deepCopyCombination(combination)
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

	function createCombination(chosenCourses)
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

	function incrementAndPropagate(base_combination, courseI, groupI)
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

	function generateCombinations(chosenCourses)
	{
		let base_combination = createCombination(chosenCourses)
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

	let combinations = generateCombinations(chosenCourses)

	console.log("combinations:")
	console.log(combinations)
	
	// helper functions initially created for helping subtitute class choices with their respective class data
	// this function takes a combination and replaces each group with the data of the class which is specified by the group.
	function substituteCombinationClasses(chosenCourses, combinations)
	{
		for (let combinationI = 0 ; combinationI < combinations.length ; combinationI++ )
		{
			for (let courseI = 0 ; courseI < chosenCourses.length ; courseI++)
			{
				let course = chosenCourses[courseI]
				
				let groupI = 0
				for ( let group_key in course.classes )
				{
					let group = course.classes[group_key]
					combinations[combinationI][courseI][groupI] = group[ combinations[combinationI][courseI][groupI].itemIndex ]
					
					groupI++
				}
			}
		}
		
		return combinations
	}
	
	combinations = substituteCombinationClasses(chosenCourses, combinations)
	
	console.log("substituted combinations:")
	console.log(combinations)

	// this code might be usefull when looking for collisions?
	/*
	let slots = new Set();
	for (let course of chosenCourses)
		for (let group_key in course.classes)
			for (let clss of course.classes[group_key])
				for (let meeting of clss.meetings)
					if (meeting.dates !== "TBA") // this line is needed if attempting to aggregate all the courses rather than the selected ones. TODO: make a github issue documenting the following; if our program goes anywhere near the 0 credit courses, it dies (our code for grouping class selectables does not work properly on those for some reason)
						for (let unix_rep of meeting.unix_representation)
							slots.add(unix_rep.start);
	slots = Array.from(slots)

	console.log("slots:")
	console.log(slots)
	*/
});
