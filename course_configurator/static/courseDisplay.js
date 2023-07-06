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

import { findAllArgsNamed } from "/static/urlArgParser.js"

// retrieve course data
fetch("/static/course_data/courses.json").then(function (response) {
	return response.json();
}).then(function (courses) {
	// some helper functions for working with the course data
	function courseCodeToObject(courseCode)
	{
		return courses.find(course => course.code === courseCode);
	}
	
	let chosenCourseCodes = findAllArgsNamed("chosenCourseCode[]")
	
	let chosenCourses = []
	for (let course_code of chosenCourseCodes)
	{
		let course = courseCodeToObject(course_code)
		
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

	let combinations = generateCombinations(chosenCourses) /*

	// initialisation to make it easier to manually select stuff, for testing. (intended to be used in tandem with selecting course indexes 3 and 0 (3 and 0 are classes with overlapping sections which allows us to test collisions))
	let combinations = [ [
		[
			{
				"itemIndex": 0,
				"length": 1
			},
			{
				"itemIndex": 0,
				"length": 17
			},
			{
				"itemIndex": 0,
				"length": 1
			}
		],
		[
			{
				"itemIndex": 0,
				"length": 1
			},
			{
				"itemIndex": 1,
				"length": 11
			},
			{
				"itemIndex": 0,
				"length": 1
			}
		]
	] ]
	//*/



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
				let newClasses = []

				let groupI = 0
				for ( let group_key in course.classes )
				{
					let group = course.classes[group_key]
					newClasses.push(group[ combinations[combinationI][courseI][groupI].itemIndex ])

					groupI++
				}

				course = JSON.parse(JSON.stringify(course))
				course.classes = newClasses
				combinations[combinationI][courseI] = course
			}
		}

		return combinations
	}

	combinations = substituteCombinationClasses(chosenCourses, combinations)

	console.log("substituted combinations:")
	console.log(combinations)
	
	// function to count the collisions in a course configuration, given by a combination object. (works by saving unix representations of each meeting to a dict, and counting occurances)
	function countCollisions(combination)
	{
		let times = {}
		let collisions = 0

		for (let course of combination)
			for (let clss of course.classes)
				for (let meeting of clss.meetings)
					if (meeting.hasOwnProperty("unix_representation"))
						for (let unix_rep of meeting.unix_representation)
							for (let time = unix_rep.start ; time < unix_rep.start+unix_rep.duration ; time += 60*60)
							{
								if (time in times) collisions++

								times[time] = time in times ? times[time]+1 : 1;
							}

		return collisions
	}

	// evaluate and store the collision counts for each combination.
	for (let i = 0 ; i < combinations.length ; i++)
		combinations[i] = { collisionCount: countCollisions(combinations[i]), combination: combinations[i] }
	
	// sort ascending
	combinations.sort( function(a, b) {return a.collisionCount-b.collisionCount} )
	// sort descending
	//combinations.sort( function(a, b) {return b.collisionCount-a.collisionCount} )

	console.log("collision-counted combinations:")
	console.log(combinations)

	// function which, given a combination object, creates a node and calender and returns a list containing 1. the html node used for the calendar 2. the calander object.
	function combinationToCalendar(combination, colourKey)
	{
		let calendarEl = document.createElement("div");
		let cal_events = []

		// building up calendar events to submit to the calander object
		for ( let course of combination )
		{
			course.colour = colourKey[course.code]
			
			for ( let clss of course.classes )
				for ( let meeting of clss.meetings )
					if (meeting.hasOwnProperty("unix_representation"))
						for (let unix_rep of meeting.unix_representation )
						{
							cal_events.push( {
								title: clss.section, // a property!
								start: (unix_rep.start)*1000, // *1000 to convert unix timestamp in seconds to miliseconds
								end: (unix_rep.start+unix_rep.duration)*1000,
								backgroundColor: course.colour, // a property!
							} )
						}
		}
		
		let calendar = new FullCalendar.Calendar(calendarEl, {initialView: 'timeGridWeek', events: cal_events});
		return {elem: calendarEl, cal: calendar}
	}
	
	// create and display calenders for all combinations. (currently limiting to 50 combinations as a workaround for performance issues)
	
	let colourKey = {}
	for (let course of combinations[0].combination)
		colourKey[course.code] = "#" + Math.floor(Math.random()*16777215).toString(16);
	
	let rendered = 0
	for (let combination of combinations)
	{
		if (rendered++ > 50) break;
		let result = combinationToCalendar(combination.combination, colourKey)
		document.getElementById("calArea").appendChild(result.elem);
		result.cal.render();
	}
	
	// set up the context menu
	let courseMenuList = document.getElementById("contextMenu").firstElementChild
	for (let course of chosenCourses)
	{
		let courseEntry = document.createElement("li")
		courseMenuList.appendChild(courseEntry)
		courseEntry.innerHTML = course.title
		
		let courseSubMenu = document.createElement("div")
		courseEntry.appendChild(courseSubMenu)
		let courseSubMenuList = document.createElement("ul")
		courseSubMenu.appendChild(courseSubMenuList)
		
		for (let group in course.classes)
		{
			let groupEntry = document.createElement("li")
			courseSubMenuList.appendChild(groupEntry)
			
			groupEntry.innerHTML = group.split("|")[1]
			
			let selectableMenu = document.createElement("div")
			groupEntry.appendChild(selectableMenu)
			let selectableMenuList = document.createElement("ul")
			selectableMenu.appendChild(selectableMenuList)
			
			
			for (let selectable of course.classes[group])
			{
				let selectableEntry = document.createElement("li")
				selectableMenuList.appendChild(selectableEntry)
				
				selectableEntry.innerHTML = selectable.section
			}
		}
	}
});
