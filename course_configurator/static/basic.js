let minCollisions = require('./timetabling_solver').minCollisions


/* here is a reminder of the json datastructure of the thing:

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
*/

fetch("/static/course_data/courses.json").then(function (response) {
	return response.json();
}).then(function (courses) {
	const slots = ['8:00', '10:00', '12:00']
	const bookables = ['Tennis', 'Climbing', 'Gymnastic', 'Trapeze', 'Handstands']
	const constraints = [
		['Tennis', 'Climbing'],
		['Handstands', 'Climbing'],
		['Trapeze', 'Tennis'],
		['Tennis', 'Handstands', 'Trapeze'],
		(timetable) => timetable["8:00"].indexOf("Climbing") === -1 ? ["Climbing"] : []
	]

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
