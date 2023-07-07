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

import { appendArg } from "/static/urlArgParser.js"

// retrieve course data and use it to populate table
fetch("/static/course_data/courses.json").then(function (response) {
	return response.json();
}).then(function (courses) {
	
	let grid = document.getElementById("courseTable")
	for (let course of courses)
	{
		// create the row for the course
		let row = document.createElement("tr");
		grid.appendChild(row)
		
		// create checkbox for the course
		let checkColumn = document.createElement("td");
		row.appendChild(checkColumn)
		let checkbox = document.createElement("input");
		checkbox.setAttribute("type", "checkbox");
		checkbox.courseCode = course.code
		checkColumn.appendChild(checkbox)

		// add all the other course properties
		for (let propName of ["code", "title"])
		{
			let column = document.createElement("td");
			row.appendChild(column)

			let prop = document.createElement("h5");
			prop.innerHTML = course[propName]
			column.appendChild(prop)
		}
	}
})

function submitCourses()
{
	// collect chosen courses
	let chosenCourseCodes = []
	for (let input of document.getElementsByTagName("input"))
		if (input.type === "checkbox" && input.checked)
			chosenCourseCodes.push(input.courseCode)
	
	// append course codes to redirect URL
	let nextURL = "/iframes/courseDisplay"
	for (let courseCode of chosenCourseCodes)
		nextURL = appendArg(nextURL, "chosenCourseCode[]="+courseCode)
	
	//alert("dismiss this to move on to next step")
	console.log("...redirecting to " + nextURL)
	window.location.href = nextURL
}

document.getElementById("courseConfirmBtn").onclick = submitCourses