let minCollisions = require('./timetabling_solver').minCollisions

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
	
	// collect chosen classes from user
	let chosenCourses = []
	let course = ""

	while (true)
	{
		course = window.prompt("enter course index (enter -1 to finish adding stuff)","-1"); // at this point we expect the user to be viewing the courses via dev tools
		if (course === "-1") { break; }
		course = courses[parseInt(course)]
		
		// parse course to group up the interchangable things (group up different labs, different lectures, etc.)
		let classGroups = []
		
		// this for loop operates on the assumption that all meetings which can be grouped together will be grouped within the json
		let firstItem = true
		for (let item of course.classes)
		{
			if (!firstItem && classGroups.slice(-1)[0].slice(-1)[0].section.slice(0, 2+1) === item.section.slice(0, 2+1)) // compare the course class descriptor to figure out if they're the same (eg. triggers when there's a lab right after a lab because all labs will have their descriptor start with "Laboratory")
			{ classGroups.slice(-1)[0].push(item) } // add the recently inspected course class to the existing group
			else
			{ classGroups.push([item]) } // add a new "group", containing the recently inspected course class
			firstItem = false
		}
		course.classes = classGroups // overwrite the dataset with the grouped up structure
		chosenCourses.push(course)
	}
	
	console.log(chosenCourses)
	return null
	
	// const slots = ['8:00', '10:00', '12:00']
	const slots = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']


	// const bookables = ['Tennis', 'Climbing', 'Gymnastic', 'Trapeze', 'Handstands']
	let bookables = []
	for (let item of chosenClasses)
	{
		bookables.push(item.class)
	}

	/*
	const constraints = [
		['Tennis', 'Climbing'],
		['Handstands', 'Climbing'],
		['Trapeze', 'Tennis'],
		['Tennis', 'Handstands', 'Trapeze'],
		(timetable) => timetable["8:00"].indexOf("Climbing") === -1 ? ["Climbing"] : []
	]
	*/
	let constraints = [bookables]

	function funcGen(time, name)
		{ return (timetable) => timetable[time].indexOf(name) === -1 ? [name] : [] }

	for (let chosenClassGroup of chosenClasses)
		for (let chosenClass of chosenClassGroup)
		{ constrains.push( funcGen(chosenClass[/* TODO: make this work */]) ) // TODO: make the constraints consider class length (atm it will probably break down when it meets 3h labs)


	data = {                // Object which represents the specification of the problem
		slots:slots,        // List of time slots
		bookables:bookables,// List of bookables that can be assigned to a specific time slot
		constraints:constraints
	/*
		constraints: [      // List of constraints
			constraint      // List of bookables which shouldn't overlap
		]
	*/
		//softFitness? = (timetable) // Optional, prioritizes between two equally fit solutions (smaller number -> more preferred)
	}

	config = {              // Object which contains extra configuration
		iterations: 1000,   // Maximum number of generations before stopping the algorithm
		size: 250,          // Size of the population
		crossover: 0.3,     // Probability of crossover happening
		mutation: 0.8,      // Probability of a mutation happening
		skip: 20,           // Numnber of generations to skip before calling partialCallback
		//debug?: false,    // provide additional data to callbacks, for easier debugging
		//...more: check out genetic-js documentation
	}

	//callback = (timetable, meta) //Function called at the end of the computation
	callback = function (timetable, meta)
	{
		console.log("timetable:");
		console.log(timetable);
		//console.log("meta:");
		//console.log(meta);
	}

	//console.log(minCollisions(data, config, callback, null)); ////////////////////////// TODO: uncomment this

});
