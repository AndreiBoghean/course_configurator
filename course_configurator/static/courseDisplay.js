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
import { generateCombinations } from "/static/combination.js"

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
	
	// create and display calenders for all combinations. (currently limiting to 25 combinations as a workaround for performance issues)
	
	let colourKey = {}
	for (let course of combinations[0].combination)
		colourKey[course.code] = "#" + Math.floor(Math.random()*16777215).toString(16);
	
	let rendered = 0
	for (let combination of combinations)
	{
		if (rendered++ > 25) break;
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
