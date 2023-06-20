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
	
	function courseCodeToObject(courseCode)
		return courses.find(course => course.code === courseCode)
	
	function idToObject(id)
	{
		id = id.split("|")
		
		if (id.length < 1) return null
		let course = courseCodeToObject(id[0])
		
		if (id.length < 2) return course
		let group = course.classes[id[0] + "|" + id[1]]
		
		if (id.length < 3) return group
		let courseClass = group.find(meeting => meeting.code === id[2])
		
		return courseClass
	}


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
		//let firstItem = true
		for (let item of course.classes)
		{
			//if (!firstItem && classGroups.slice(-1)[0].slice(-1)[0].section.slice(0, 2+1) === item.section.slice(0, 2+1)) // compare the course class descriptor to figure out if they're the same (eg. triggers when there's a lab right after a lab because all labs will have their descriptor start with "Laboratory")
			//{ classGroups.slice(-1)[0].push(item) } // add the recently inspected course class to the existing group
			//else
			//{ classGroups.push([item]) } // add a new "group", containing the recently inspected course class
			//firstItem = false
			
			let key = course.code + "|" + item.section.split(" ")[0]
			if (key in classGroups) classGroups[key].push(item)
			else classGroups[key] = [item]
		}
		course.classes = classGroups // overwrite the dataset with the grouped up structure
		chosenCourses.push(course)
	}

	console.log("chosenCourses:")
	console.log(chosenCourses)

	// const slots = ['8:00', '10:00', '12:00']


	/*
	let slots = []
	const times = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
	const days = ["mo", "tu", "we", "th", "fr"]
	for (let day of days)
		for (let time of times)
			slots.push(day + "_" + time)
	// note: we should change from doing slot times with respect to each week, to agregating all start times from all possible slots.
	*/

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

	// const bookables = ['Tennis', 'Climbing', 'Gymnastic', 'Trapeze', 'Handstands']
	let bookables = []
	let groupID = 0;
	for (let course of chosenCourses)
		for (let group_key in course.classes)
			bookables.push(JSON.stringify(idToObject(group_key)))

	console.log("bookables:")
	console.log(bookables)
	return null

	/* notes on how to handle constraints:
	we need to enforce the grouping between different slots, ie. as long as the user has picked ANY slot in "group2" (arbitrarily the group containing lab slots), it will be valid.
	we also need to enforce the times of the slots (ie. LB01 must be enforced as being on monday 8:00, LB02 must be enforced on tues 13:00, etc.)

	complex contraint rules work by creating a lambda function which has parameters for the timetable, and then parses the timetable to see if anything in it breaks our arbitrary rules.
	to enforce grouping, we can loop through each item in a group, and check that any of the group items are inside the timetable
	to enforce timeslots, we can loop over each item in the timetable, look it up in the courses dataset, and check that the times match up.

	note that we also pass in the list of all selectables as a simple constraint, because idealy nothing overlaps
	*/

	/*
	const constraints = [
		['Tennis', 'Climbing'],
		['Handstands', 'Climbing'],
		['Trapeze', 'Tennis'],
		['Tennis', 'Handstands', 'Trapeze'],
		(timetable) => timetable["8:00"].indexOf("Climbing") === -1 ? ["Climbing"] : []
	]
	*/
	let constraints = [
		bookables,
		(timetable) => { // constraint for enforcing groups
			/*
			for (let chosenCourse of chosenCourses)
				for (let group of chosenCourse.classes)
				{
					let found = false
					for (let slot_option of group)
						if (slot_option in timetable.chosen)
						{
							found = true
							break
						}
					if (!found) { return false }
				}
			return true;
			*/
		
			// for a group to be valid, ONE of it's member classes must have ALL of it's meetings selected.
			for (let group_id of bookables)
			{
				let group_valid = false
				for (let clss of idToObject(group_id))
				{
					let class_valid = true
					for (let meeting_time of clss.meetings.unix_representation)
					{
						if (timetable[meeting_time.start] !== group)
						{
							class_valid = false
							break
						}
					}
					if (class_valid)
					{
						group_valid = true
						break
					}
				}
				if (!group_valid)
					return [group_id]
				
			}
		},
		(timetable) => { // constraint for enforcing the times of the different slot options. (note that atm this assumes each thing is 1 hour long)
			for (let chosen_option of timetable.chosen)
			{
				let found = false
				for (let chosenCourse of chosenCourses)
					for (let group of chosenCourse.classes)
					{
						for (let slot_option of group)
							if (slot_option.class === chosen_option)
							{
								if (chosen_option.unix_representation === slot_option.unix_representation)
								{
									found = true
									break
								}
							}
					}
				if (!found) { return false }
			}
			return true;
		}
	]

	/* note: idk what my thought proccess was here. TODO: delete this
	function funcGen(time, name)
		{ return (timetable) => timetable[time].indexOf(name) === -1 ? [name] : [] }

	for (let chosenClassGroup of chosenClasses)
		for (let chosenClass of chosenClassGroup)
		{ constrains.push( funcGen(chosenClass["TODO: make this work"]) ) } // TODO: make the constraints consider class length (atm it will probably break down when it meets 3h labs)
	*/

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

	console.log(minCollisions(data, config, callback, null)); ////////////////////////// TODO: uncomment this

});
