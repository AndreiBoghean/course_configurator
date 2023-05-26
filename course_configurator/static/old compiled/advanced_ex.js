(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const solve = require('..').minCollisions

const multiple = (length, string) =>
  Array.apply([], { length }).map((a, i) => `${string}${i + 1}`)
const randomSet = (length, bookables) => {
  const bookablesCopy = bookables.slice()
  const result = []
  while (length--) {
    const randomIndex = Math.floor(Math.random() * bookablesCopy.length)
    result.push(bookablesCopy[randomIndex])
    bookablesCopy.splice(randomIndex, 1)
  }
  return result
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const slots = days.reduce((acc, day) => acc.concat(multiple(4, day)), [])
const bookables = [].concat(multiple(10, 'Math'))
  .concat(multiple(8, 'Physics'))
  .concat(multiple(8, 'Chemistry'))
  .concat(multiple(10, 'English'))
  .concat(multiple(5, 'History'))
  .concat(multiple(5, 'Geography'))
  .concat(multiple(7, 'Italian'))
  .concat(multiple(5, 'Philosophy'))
const constraints = [
  randomSet(20, bookables),
  randomSet(20, bookables),
  randomSet(20, bookables),
  randomSet(20, bookables),
  randomSet(20, bookables)
]

solve({ slots, bookables, constraints }, { skip: 1, size: 50 },
  (table, { fitness }) => console.log(table, fitness),
  (table, { generation, fitness }) => console.log(generation, fitness))

/*
0 20
1 18
2 17
3 16
4 15
5 14
6 13
7 12
8 11
9 10
10 9
11 9
12 8
13 7
14 6
15 5
16 4
17 3
18 3
19 3
20 3
21 2
22 1
{ Friday1: [ 'Chemistry2', 'Italian5', 'English1' ],
  Wednesday2: [ 'Math3', 'Chemistry1', 'English6' ],
  Wednesday4: [ 'English7', 'Physics3', 'English10' ],
  Friday3: [ 'Physics4', 'Philosophy4', 'Math9' ],
  Thursday4: [ 'Geography3', 'Chemistry6', 'Math10' ],
  Tuesday2: [ 'Chemistry8', 'Philosophy5', 'Math7' ],
  Monday2: [ 'Chemistry7', 'Physics1', 'History5' ],
  Tuesday1: [ 'Italian4', 'Physics7', 'Math4' ],
  Friday4: [ 'Geography4', 'Philosophy3', 'Chemistry5' ],
  Wednesday1: [ 'English4', 'History2', 'History1' ],
  Thursday1: [ 'Math6', 'Math8', 'English8' ],
  Thursday3: [ 'English2', 'Physics5', 'Chemistry3' ],
  Monday3: [ 'Italian6', 'Math5', 'Italian1' ],
  Wednesday3: [ 'History4', 'Philosophy1', 'Math1' ],
  Tuesday3: [ 'English5', 'Italian2', 'English9' ],
  Tuesday4: [ 'Chemistry4', 'Italian3', 'Philosophy2' ],
  Monday4: [ 'History3', 'Geography2', 'Physics6' ],
  Monday1: [ 'Geography1', 'Geography5', 'English3' ],
  Friday2: [ 'Physics2', 'Italian7' ],
  Thursday2: [ 'Math2', 'Physics8' ] } 0
*/

},{"..":2}],2:[function(require,module,exports){
module.exports = require('./src/index')

},{"./src/index":6}],3:[function(require,module,exports){
const { swap, shuffle, table, detable } = require('./helpers')

const findSlot = (bookable, table) =>
  Object.keys(table).find((slot) => table[slot].indexOf(bookable) > -1)
const swapBookable = (bookable, slot, table) => {
  if (!table[slot]) table[slot] = []
  const length = table[slot].push(bookable)
  if (length > 1) {
    swap(table[slot], length - 1, Math.floor(Math.random() * (length - 1)))
    const targetSlot = findSlot(bookable, table)
    table[targetSlot].push(table[slot].pop())
    const oldIndex = table[targetSlot].findIndex((item) => item === bookable)
    table[targetSlot].splice(oldIndex, 1)
  }
}

module.exports = function (mother, father) {
  const bookables = shuffle(this.userData.bookables)
  const tables = [table(...mother), table(...father)]
  const slots = [father[0], mother[0]]
  const [a, b] = [
    Math.floor(Math.random() * bookables.length),
    Math.floor(Math.random() * bookables.length)
  ].sort()
  bookables.forEach((bookable, i, arr, index = Number(i < a || i > b)) =>
    swapBookable(bookable, findSlot(bookable, tables[Number(!index)]), tables[index]))
  return tables.map((table, i) => detable(slots[i], table))
}

},{"./helpers":5}],4:[function(require,module,exports){
const { table, findCollisions } = require('./helpers')

module.exports = function (entity) {
  const constraints = this.userData.constraints
  const softFitness = this.userData.softFitness || (timetable => 0)
  const timetable = table(...entity)

  return constraints.reduce((acc, constraint) =>
    acc + findCollisions(timetable, constraint).length, 0) + softFitness(timetable)
}

},{"./helpers":5}],5:[function(require,module,exports){
const swap = (arr, i, j) => {
  const t = arr[i]
  arr[i] = arr[j]
  arr[j] = t
}

const shuffle = (arr) => {
  const result = arr.slice()
  let i = arr.length
  if (i === 0) return result
  while (--i) {
    const j = Math.floor(Math.random() * (i + 1))
    swap(result, i, j)
  }
  return result
}

const table = (slots, bookables) => {
  let slotIndex = 0
  return bookables.reduce((acc, bookable) => {
    const slot = slots[slotIndex++ % slots.length]
    return Object.assign({}, acc, { [slot]: (acc[slot] || []).concat(bookable) })
  }, {})
}

const detable = (slots, table) => {
  const bookables = []
  let total = slots.reduce((acc, key) => acc + (table[key] || []).length, 0)
  while (total) {
    slots.forEach((slot) =>
      table[slot].length &&
      bookables.push(table[slot].shift()) &&
      total--
    )
  }
  return [slots, bookables]
}

const hasDifference = (a, b) =>
  Boolean(a.filter(x => b.indexOf(x) < 0).length ||
          b.filter(x => a.indexOf(x) < 0).length)

const findCollisions = (timetable, constraint) => {
  if (typeof constraint === 'function') return constraint(timetable)
  const inSlot = (bookable) => (slot) => timetable[slot].indexOf(bookable) !== -1
  const slots = Object.keys(timetable)
  const slotLists = constraint.map((bookable) => [bookable, slots.filter(inSlot(bookable))])
  const collisions = slotLists.reduce((acc, [bookable, slotList], i, slotLists) =>
    acc.concat(slotLists.slice(i + 1).reduce((acc, [bookableTarget, slotListTarget]) =>
      acc.concat(slotList.length && slotListTarget.length && !hasDifference(slotList, slotListTarget)
        ? [bookable, bookableTarget].join()
        : []), [])), [])
  return collisions
}

module.exports = {
  swap, shuffle, table, detable, findCollisions
}

},{}],6:[function(require,module,exports){
const Genetic = require('genetic-js-no-ww')

const { table, findCollisions } = require('./helpers')
const seed = require('./seed')
const mutate = require('./mutate')
const crossover = require('./crossover')
const fitness = require('./fitness')

exports.minCollisions = (data, config = {}, callback, partialCallback) => {
  if (!data) data = {}

  const genetic = Genetic.create()
  genetic.optimize = Genetic.Optimize.Minimize
  genetic.select1 = Genetic.Select1.Fittest
  genetic.select2 = Genetic.Select2.Tournament2
  genetic.seed = seed
  genetic.mutate = mutate
  genetic.crossover = crossover
  genetic.fitness = fitness
  genetic.generation = ([{ fitness }]) => fitness !== 0
  genetic.notification = function (pop, generation, stats, isFinished) {
    const { entity, fitness } = pop[0]
    const timetable = table(...entity)
    const constraints = this.userData.constraints
    const collisions = constraints.reduce((acc, constraint) =>
      acc.concat(findCollisions(timetable, constraint)), [])
    const popTables = config.debug ? pop.map(p => ({ fitness: p.fitness, entity: table(...p.entity) })) : null
    const meta = { fitness, generation, stats, pop, popTables, collisions }
    if (isFinished && callback) return callback(timetable, meta)
    if (partialCallback) return partialCallback(timetable, meta)
  }

  const defaults = {
    iterations: 1000,
    size: 250,
    crossover: 0.3,
    mutation: 0.8,
    skip: 20
  }
  genetic.evolve(Object.assign(defaults, config), data)
}

},{"./crossover":3,"./fitness":4,"./helpers":5,"./mutate":7,"./seed":8,"genetic-js-no-ww":9}],7:[function(require,module,exports){
const { table, swap, findCollisions } = require('./helpers')

module.exports = function (entity) {
  const result = [
    entity[0].slice(),
    entity[1].slice()
  ]
  const constraints = this.userData.constraints
  const bookables = this.userData.bookables
  const timetable = table(...entity)
  const collisions = constraints.reduce((acc, constraint) =>
    acc.concat(findCollisions(timetable, constraint)), [])
  const randomCollision = collisions.length > 0
    ? collisions[Math.floor(Math.random() * collisions.length)]
      .split(',')[Math.floor(Math.random() * 2)]
    : bookables[Math.floor(Math.random() * bookables.length)]
  const i = result[1].findIndex((bookable) => bookable === randomCollision)
  let j = Math.floor(Math.random() * (result[1].length - 1))
  if (j >= i) j++
  swap(result[1], i, j)
  return result
}

},{"./helpers":5}],8:[function(require,module,exports){
const { shuffle } = require('./helpers')

module.exports = function () {
  return [
    shuffle(this.userData.slots),
    shuffle(this.userData.bookables)
  ]
}

},{"./helpers":5}],9:[function(require,module,exports){

var Genetic = Genetic || (function(){
	
	'use strict';
	
	// facilitates communcation between web workers
	var Serialization = {
		"stringify": function (obj) {
			return JSON.stringify(obj, function (key, value) {
				if (value instanceof Function || typeof value == "function") return "__func__:" + value.toString();
				if (value instanceof RegExp) return "__regex__:" + value;
				return value;
			});
		}, "parse": function (str) {
			return JSON.parse(str, function (key, value) {
				if (typeof value != "string") return value;
				if (value.lastIndexOf("__func__:", 0) === 0) return eval('(' + value.slice(9) + ')');
				if (value.lastIndexOf("__regex__:", 0) === 0) return eval('(' + value.slice(10) + ')');
				return value;
			});
		}
	};
	
	var Clone = function(obj) {
		if (obj == null || typeof obj != "object")
			return obj;
		
		return JSON.parse(JSON.stringify(obj));
	};
	
	var Optimize = {
		"Maximize": function (a, b) { return a >= b; }
		, "Minimize": function (a, b) { return a < b; }
	};
	
	var Select1 = {
		"Tournament2": function(pop) {
			var n = pop.length;
			var a = pop[Math.floor(Math.random()*n)];
			var b = pop[Math.floor(Math.random()*n)];
			return this.optimize(a.fitness, b.fitness) ? a.entity : b.entity;
		}, "Tournament3": function(pop) {
			var n = pop.length;
			var a = pop[Math.floor(Math.random()*n)];
			var b = pop[Math.floor(Math.random()*n)];
			var c = pop[Math.floor(Math.random()*n)];
			var best = this.optimize(a.fitness, b.fitness) ? a : b;
			best = this.optimize(best.fitness, c.fitness) ? best : c;
			return best.entity;
		}, "Fittest": function (pop) {
			return pop[0].entity;
		}, "Random": function (pop) {
			return pop[Math.floor(Math.random()*pop.length)].entity;
		}, "RandomLinearRank": function (pop) {
			this.internalGenState["rlr"] = this.internalGenState["rlr"]||0;
			return pop[Math.floor(Math.random()*Math.min(pop.length,(this.internalGenState["rlr"]++)))].entity;
		}, "Sequential": function (pop) {
			this.internalGenState["seq"] = this.internalGenState["seq"]||0;
			return pop[(this.internalGenState["seq"]++)%pop.length].entity;
		}
	};
	
	var Select2 = {
		"Tournament2": function(pop) {
			return [Select1.Tournament2.call(this, pop), Select1.Tournament2.call(this, pop)];
		}, "Tournament3": function(pop) {
			return [Select1.Tournament3.call(this, pop), Select1.Tournament3.call(this, pop)];
		}, "Random": function (pop) {
			return [Select1.Random.call(this, pop), Select1.Random.call(this, pop)];
		}, "RandomLinearRank": function (pop) {
			return [Select1.RandomLinearRank.call(this, pop), Select1.RandomLinearRank.call(this, pop)];
		}, "Sequential": function (pop) {
			return [Select1.Sequential.call(this, pop), Select1.Sequential.call(this, pop)];
		}, "FittestRandom": function (pop) {
			return [Select1.Fittest.call(this, pop), Select1.Random.call(this, pop)];
		}
	};
	
	function Genetic() {
		
		// population
		this.fitness = null;
		this.seed = null;
		this.mutate = null;
		this.crossover = null;
		this.select1 = null;
		this.select2 = null;
		this.optimize = null;
		this.generation = null;
		this.notification = null;
		
		this.configuration = {
			"size": 250
			, "crossover": 0.9
			, "mutation": 0.2
			, "iterations": 100
			, "fittestAlwaysSurvives": true
			, "maxResults": 100
			, "skip": 0
		};
		
		this.userData = {};
		this.internalGenState = {};
		
		this.entities = [];
				
		this.start = function() {
			
			var i;
			var self = this;
			
			function mutateOrNot(entity) {
				// applies mutation based on mutation probability
				return Math.random() <= self.configuration.mutation && self.mutate ? self.mutate(Clone(entity)) : entity;
			}
			
			// seed the population
			for (i=0;i<this.configuration.size;++i)  {
				this.entities.push(Clone(this.seed()));
			}
			
			for (i=0;i<this.configuration.iterations;++i) {
				// reset for each generation
				this.internalGenState = {};
				
				// score and sort
				var pop = this.entities
					.map(function (entity) {
						return {"fitness": self.fitness(entity), "entity": entity };
					})
					.sort(function (a, b) {
						return self.optimize(a.fitness, b.fitness) ? -1 : 1;
					});
				
				// generation notification
				var mean = pop.reduce(function (a, b) { return a + b.fitness; }, 0)/pop.length;
				var stdev = Math.sqrt(pop
					.map(function (a) { return (a.fitness - mean) * (a.fitness - mean); })
					.reduce(function (a, b) { return a+b; }, 0)/pop.length);
					
				var stats = {
					"maximum": pop[0].fitness
					, "minimum": pop[pop.length-1].fitness
					, "mean": mean
					, "stdev": stdev
				};

				var r = this.generation ? this.generation(pop.slice(0, this.configuration["maxResults"]), i, stats) : true;
				var isFinished = (typeof r != "undefined" && !r) || (i == this.configuration.iterations-1);
				
				if (
					this.notification
					&& (isFinished || this.configuration["skip"] == 0 || i%this.configuration["skip"] == 0)
				) {
					this.sendNotification(pop.slice(0, this.configuration["maxResults"]), i, stats, isFinished);
				}
					
				if (isFinished)
					break;
				
				// crossover and mutate
				var newPop = [];
				
				if (this.configuration.fittestAlwaysSurvives) // lets the best solution fall through
					newPop.push(pop[0].entity);
				
				while (newPop.length < self.configuration.size) {
					if (
						this.crossover // if there is a crossover function
						&& Math.random() <= this.configuration.crossover // base crossover on specified probability
						&& newPop.length+1 < self.configuration.size // keeps us from going 1 over the max population size
					) {
						var parents = this.select2(pop);
						var children = this.crossover(Clone(parents[0]), Clone(parents[1])).map(mutateOrNot);
						newPop.push(children[0], children[1]);
					} else {
						newPop.push(mutateOrNot(self.select1(pop)));
					}
				}
				
				this.entities = newPop;
			}
		}
		
		this.sendNotification = function(pop, generation, stats, isFinished) {
			var response = {
				"pop": pop.map(Serialization.stringify)
				, "generation": generation
				, "stats": stats
				, "isFinished": isFinished
			};
			
			this.notification(response.pop.map(Serialization.parse), response.generation, response.stats, response.isFinished);
		};
	}
	
	Genetic.prototype.evolve = function(config, userData) {
		
		var k;
		for (k in config) {
			this.configuration[k] = config[k];
		}
		
		for (k in userData) {
			this.userData[k] = userData[k];
		}
		this.start();
	}
	
	return {
		"create": function() {
			return new Genetic();
		}, "Select1": Select1
		, "Select2": Select2
		, "Optimize": Optimize
		, "Clone": Clone
	};
	
})();


// so we don't have to build to run in the browser
if (typeof module != "undefined") {
	module.exports = Genetic;
}

},{}]},{},[1]);
