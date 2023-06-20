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
	
	function courseCodeToObject(courseCode)
	{ return courses.find(course => course.code === courseCode) }
	
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

	
	/*
	the "combinations" is a variable containing a list of all the combinations of things.
	each "combination" is a list, structured as follows:
	each item in this list coresponds to a course
	this "item" is itself a list, containing a list of numbers
	with each number representing the chosen thing for a given group
	
	eg. for CS1P, CS1S, and CS1F:
	[[0, 0, 0], [0, 0, 0, 0], [0, 0, 0]]
	this means
	[[enrollment0, lect0, lab0], [enrollment0, lect0, lab0, tutorial0], [enrollment0, lect0, lab0]]
	
	(note that this example is not representative of the actual structure of these courses)
	*/
	function generateCombinations(chosenCourses)
	{
		// helper functions
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
		
		
		let base_combination = createCombination(chosenCourses)
		let original_base_combination = zeroCombination(base_combination)
		
		/*
		now, we repeatedly increment the values reprenting the chosen things, until the value overruns and loops back to 0 once it reaches the number of selectables in the given group.
		*/
		
		let combinations = []
		while (true)
		{
			let last_classI = base_combination.length-1
			let last_groupI = base_combination[last_classI].length-1
			base_combination = incrementAndPropagate(base_combination, last_classI, last_groupI)
			
			combinations.push(deepCopyCombination(base_combination))
			
			// if everything is 0 again, that means the combination has fully overflowed and we have looped back and are ready to break & continue w the rest of the program (note that this is also why we seem to skip the step of adding the first combination. (it gets added at the end))
			if (compareCombination(base_combination, original_base_combination))
				break
			/* potentially outdated code for trying overflow
			// loop over courses
			for (let group_i=base_combination.length-1 ; i>= 0 ; i--)
			{
				let group = base_combination[group_i]
				
				// loop over groups
				for (let item_i = group.length-1 ; item_i >= 0 ; i--)
				{
					// check for overrun
					if (group[item_i].itemIndex > group[item_i].length-1)
					{
						group[item_i].itemIndex = 0
						
						let prev_group = base_combination[group_i-1]
						prev_group[prev_group.length-1] += 1
					}
				}
			}
			*/
		}
		
		return combinations
	}
	
	let combinations = generateCombinations(chosenCourses)
	
	console.log("combinations:")
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
