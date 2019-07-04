const uwApiKey = "a0fa5a0445627c840d18a3cf30d89995";
const googleApiKey = "AIzaSyDbxPyrNeLrgCJE_Fip-jqXcIJj3BzTLEw";
var done = false;

// Takes a date string (eg. "MWThF") and returns a list of days ["M", "W", "Th", "F"]
function processDate(weekdays) {
  var index = 0;
  var dayList = [];
  if (weekdays == null) {
    return dayList;
  }
   if (index < weekdays.length && weekdays[index] == 'M') {
     dayList.push("M")
     index++
   }
   if (index < weekdays.length && weekdays[index] == 'T' && (index + 1 == weekdays.length ? true : weekdays[index + 1] != 'h')) {
     dayList.push("T")
     index++;
   }
   if (index < weekdays.length && weekdays[index] == 'W')
   {
     dayList.push("W")
     index++;
   }
   if ((index + 1) < weekdays.length && weekdays[index] == 'T' && (index + 1 == weekdays.length ? true : weekdays[index + 1] == 'h'))
   {
     dayList.push("Th")
     index += 2;
   }
   if (index < weekdays.length && weekdays[index] == 'F')
   {
     dayList.push("F")
     index++;
   }

   return dayList;
}

function isTimeConflict(start1, end1, start2, end2) {
   return ((start1.getTime() <= end2.getTime()) && (end1.getTime() >= start2.getTime()))
}

// Determines if two courses have overlapping times.
function isConflict(course1, course2) {
  let class1 = course1.classes[0]
  let class2 = course2.classes[0]
  let days1 = processDate(class1.date.weekdays)
  let days2 = processDate(class2.date.weekdays)
  let start1 = new Date(`1/1/2016 ${class1.date.start_time}`)
  let end1 = new Date(`1/1/2016 ${class1.date.end_time}`)
  let start2 = new Date(`1/1/2016 ${class2.date.start_time}`)
  let end2 = new Date(`1/1/2016 ${class2.date.end_time}`)
  for (let i = 0; i < days1.length; ++i) {
    if (days2.includes(days1[i]) && isTimeConflict(start1, end1, start2, end2)) {
      return true
    }
  }
  return false
}

// Function to process input if user chooses to input schedule from Quest rather than manual entry.
function getTermFromQuest(scheduleString) {
  var lines = scheduleString.split('\n');
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes('| Undergraduate | University of Waterloo')) {
      term = termMap.get(lines[i].slice(0, lines[i].indexOf('|') - 1));
      break;
    }
  }
}

// Function to process input if user chooses to input schedule from Quest rather than manual entry.
function getCoursesFromQuest(scheduleString, courseArr) {
  let start = scheduleString.indexOf('Show Waitlisted Classes') + 24;
  let end = scheduleString.indexOf('Printer Friendly Page') - 1;
  let coursesString = scheduleString.slice(start, end);
  var lines = coursesString.split('\n');
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].includes('Status')) {
      let courseString = lines[i-1].substr(0, lines[i-1].indexOf('-')-1).replace(/\s/g, '');
      let firstDigit = courseString.search(/\d/);
      courseArr.push([courseString.substring(0, firstDigit), courseString.substring(firstDigit)]);
    }
  }
}

// On clicking Generate schedules, this function is fired.
function submit() {
  done = false;
  // Clear the page of any existing schedules.
  var myNode = document.getElementById("schedules");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }

  // Display loading spinner.
  document.getElementById("loading").style.display = 'block';

  // Based on user input, add courses to courseArr.
  var courseArr = [];
  if (inputMode === 'manual') {
    term = document.getElementById('termNumber').value;
    numCourses = parseInt(document.getElementById('numCourses2').value);
    for (let i = 1; i <= numCourses; ++i) {
      var courseString = document.getElementById(`course${i}`).value.toUpperCase().replace(/\s/g, '');
      var firstDigit = courseString.search(/\d/)
      var course = [courseString.substring(0, firstDigit), courseString.substring(firstDigit)]
      courseArr.push(course)
    }
  } else {
    let scheduleString = document.getElementById("importQuest").value;
    getTermFromQuest(scheduleString);
    getCoursesFromQuest(scheduleString, courseArr);
    numCourses = courseArr.length;
  }

  var morning = document.getElementById('morning').checked;
  var night = document.getElementById('night').checked;

  // For each course, determine information about its offered lectures and tutorials.
  var courses = []
  for (let i = 0; i < numCourses; ++i) {
    var error = false;
    var requestString = `https://api.uwaterloo.ca/v2/terms/${term}/`
    requestString += `${courseArr[i][0]}/${courseArr[i][1]}/schedule.json?key=${uwApiKey}`
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": requestString,
      "method": "GET",
      "error": function () {
        alert(`Error! ${courseArr[i][0]}${courseArr[i][1]} is not being offered this term!`)
        error = true
        document.getElementById("loading").style.display = 'none'
      }
    }

    $.ajax(settings).then(function (response) {
      if (response.meta.status !== 200) {
        alert(`Error! ${courseArr[i][0]}${courseArr[i][1]} is not being offered this term!`)
        error = true
      }
      let validClasses = response.data.filter(myClass =>
        isClassValid(myClass)
      )
      let lecs = [];
      let tuts = []
      validClasses.forEach(course => {
        course.section.includes("LEC") ? lecs.push(course) : tuts.push(course);
      })
      if (lecs.length > 0) {
        courses.push(lecs);
      }
      if (tuts.length > 0) {
        courses.push(tuts);
        numCourses++;
      }
      if (lecs.length === 0) {
        // If nothing is returned, alert user that course is not being offered.
        alert(`Error! ${courseArr[i][0]}${courseArr[i][1]} is not being offered this term!`)
        error = true
      }
    }).then(() => {
      if (!error) {
        generateSchedules(courses)
      } else {
        // If error occurred, hide loading spinner.
        document.getElementById("loading").style.display = 'none'
      }
    })
  }
}

// If user didn't check the morning box, remove all 8:30AM classes.
// If user didn't check the night box, remove all classes starting after 6:00PM.
function isClassValid(myClass) {
  return !(!morning.checked && myClass.classes[0].date.start_time === '08:30')  &&
  !(!night.checked && new Date(`1/1/2016 ${myClass.classes[0].date.start_time}`) >= new Date("1/1/2016 18:00")) &&
  !(myClass.campus !== 'UW U') && ((myClass.section.includes("LEC")) || (myClass.section.includes("TUT")))
}

// If any two courses in a schedule overlap, it's considered invalid.
function isScheduleValid(schedule) {
  for (let i = 0 ; i < schedule.length - 1; ++i) {
    for (let j = i+1; j < schedule.length; ++j) {
      if (isConflict(schedule[i], schedule[j]) ||
      schedule[i].campus !== "UW U" || schedule[j].campus !== "UW U") {
        return false
      }
    }
  }
  return true
}

function cartesianProduct(arr) {
    return arr.reduce(function(a,b){
        return a.map(function(x){
            return b.map(function(y){
                return x.concat(y);
            })
        }).reduce(function(a,b){ return a.concat(b) },[])
    }, [[]])
}

function generateSchedules(courses) {
  if (courses.length < numCourses) return
  let courseArr = [];
  for (let i = 0; i < numCourses; ++i) {
    courseArr.push(courses[i]);
  }
  // Generate a giant list of schedules, representing all possible combinations of each courses' lectures/tutorials.
  let schedules = cartesianProduct(courseArr);

  // If schedule is invalid, filter it out.
  schedules = schedules.filter(schedule =>
    isScheduleValid(schedule)
  )

  if (schedules.length == 0) {
    document.getElementById("loading").style.display = 'none';
    alert(`No valid schedules can be made!`);
    return;
  }

  // Add times and dates to each schedule.
  getTimes(schedules)
  getTermDates(schedules)
}

function compareTimes(time1, time2) {
  let num1 = parseInt(time1.substring(0, time1.indexOf(':'))) * 100 + parseInt(time1.substring(time1.indexOf(':')+1))
  let num2 = parseInt(time2.substring(0, time2.indexOf(':'))) * 100 + parseInt(time2.substring(time2.indexOf(':')+1))
  return num1 - num2
}

function getTimes(schedules) {
  schedules.forEach(schedule => {
    let mTimes = []
    let tTimes = []
    let wTimes = []
    let thTimes = []
    let fTimes = []
    for (let i = 0; i < schedule.length; ++i) {
      if (schedule[i].classes[0].date.weekdays === null) return
      if (schedule[i].classes[0].date.weekdays.includes("M")) {
        mTimes.push(schedule[i].classes[0].date.start_time)
        mTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.match(/(T[^h]|T$)/)) {
        tTimes.push(schedule[i].classes[0].date.start_time)
        tTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.includes("W")) {
        wTimes.push(schedule[i].classes[0].date.start_time)
        wTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.includes("Th")) {
        thTimes.push(schedule[i].classes[0].date.start_time)
        thTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.includes("F")) {
        fTimes.push(schedule[i].classes[0].date.start_time)
        fTimes.push(schedule[i].classes[0].date.end_time)
      }
    }
    schedule.mTimes = [ ...new Set(mTimes) ].sort(compareTimes)
    schedule.tTimes = [ ...new Set(tTimes) ].sort(compareTimes)
    schedule.wTimes = [ ...new Set(wTimes) ].sort(compareTimes)
    schedule.thTimes = [ ...new Set(thTimes) ].sort(compareTimes)
    schedule.fTimes = [ ...new Set(fTimes) ].sort(compareTimes)
  })
}


// Get the start/end dates for the given term.
function getTermDates(schedules) {
  var startDate;
  var endDate;

  let year = Math.floor((parseInt(term) - 1000) / 10) + 2000
  if (term.endsWith('1')) {
    startDate = `${year}-01-01`;
    endDate = `${year}-04-30`;
  } else if (term.endsWith('5')) {
    startDate = `${year}-05-01`;
    endDate = `${year}-08-31`;
  } else if (term.endsWith('9')) {
    startDate = `${year}-09-01`;
    endDate = `${year}-12-31`;
  }
  console.log(startDate)
  console.log(endDate)

  calculateProfessorRating(schedules)
}

// function calculateDistanceRating(schedules) {
//   var buildings = []
//   schedules.forEach(schedule => {
//     for (let i = 0; i < schedule.length; ++i) {
//       let building = schedule[i].classes[0].location.building
//       if (building && !buildings.includes(building)) {
//         buildings.push(building)
//       }
//     }
//   })
//   var buildingCoords = []
//   var buildingDistances = []
//   for (let i = 0; i < buildings.length; ++i) {
//     var settings = {
//       "async": true,
//       "crossDomain": true,
//       "url": `https://api.uwaterloo.ca/v2/buildings/${buildings[i]}.json?key=${uwApiKey}`,
//       "method": "GET"
//     }
//
//     $.ajax(settings).then(function (response) {
//       noRes = (response.data.length === 0)
//       let coords = noRes ? [buildings[i], {latitude: 43.47207511, longitude: -80.54394739}] :
//       [buildings[i], {latitude: parseFloat(response.data.latitude),
//         longitude: parseFloat(response.data.longitude)}]
//       buildingCoords.push(coords)
//     }).then(() => {
//       if (buildingCoords.length === buildings.length) {
//         var buildingMap = new Map(buildingCoords)
//         for (let i = 0; i < buildings.length - 1; ++i) {
//           for (let j = i + 1; j < buildings.length; ++j) {
//             let lat1 = buildingMap.get(buildings[i]).latitude
//             let long1 = buildingMap.get(buildings[i]).longitude
//             let lat2 = buildingMap.get(buildings[j]).latitude
//             let long2 = buildingMap.get(buildings[j]).longitude
//             var settings = {
//               "async": true,
//               "crossDomain": true,
//               "url": `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${long1}&destinations=${lat2},${long2}&mode=walking&key=${googleApiKey}`,
//               "method": "GET"
//             }
//
//             $.ajax(settings).then(function (response) {
//               console.log(response)
//               buildingDistances.push([buildings[i] + buildings[j],
//                 response.rows[0].elements[0].duration.value])
//             })
//           }
//         }
//       }
//     }).then(() => {
//       if (buildingDistances.length === (buildings.length * buildings.length - 1) / 2) {
//         let distanceMap = new Map(buildingDistances)
//         schedules.forEach((schedule) => {
//           let totalRating = 0
//           for (let i = 0; i < schedule.length; ++i) {
//             let rating = profsMap.get(schedule[i].classes[0].instructors[0]) ?
//             profsMap.get(schedule[i].classes[0].instructors[0]) : 2
//             schedule[i].classes[0].rating = rating
//             totalRating += rating
//           }
//           schedule.professorRating = totalRating / schedule.length
//         })
//       }
//     })
//   }
// }

function calculateProfessorRating(schedules) {
  var profs = []
  schedules.forEach(schedule => {
    for (let i = 0; i < schedule.length; ++i) {
      if (!schedule[i].section.includes("LEC")) continue;
      let professor = schedule[i].classes[0].instructors[0]
      if (professor && !profs.includes(professor)) {
        profs.push(professor)
      }
    }
  })
  var profsRatings = []
  for (let i = 0; i < profs.length; ++i) {
    let commaIndex = profs[i].indexOf(',')
    let spaceIndex = profs[i].indexOf(' ')
    let lName = profs[i].substring(0, commaIndex)
    let fName = spaceIndex === -1 ? profs[i].substring(commaIndex + 1) :
    profs[i].substring(commaIndex + 1, spaceIndex)
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": `https://cors-anywhere.herokuapp.com/https://www.ratemyprofessors.com/find/professor/?&page=1&sid=1490&queryoption=TEACHER&queryBy=teacherName&query=${fName}+${lName}`,
      "method": "GET",
      // "error": function () {
      //   alert("Oops! Something went wrong. Please try again later.")
      // }
    }

    $.ajax(settings).then(function (response) {
      noRes = (response.professors.length === 0)
      let rating = noRes ? -1 : parseFloat(response.professors[0].overall_rating)
      profsRatings.push([profs[i], rating])
    }).then(() => {
      if (profsRatings.length === profs.length && !done) {
        done = true;
        let profsMap = new Map(profsRatings)
        let numTuts = schedules[0].filter(el => el.section.includes("TUT")).length;
        schedules.forEach((schedule) => {
          let totalRating = 0
          for (let i = 0; i < schedule.length; ++i) {
            if (schedule[i].section.includes("TUT")) continue;
            let score = profsMap.get(schedule[i].classes[0].instructors[0])
            let rating = (!score || score === -1) ? 2 : score
            schedule[i].classes[0].rating = (!score || score === -1) ? 'Not Found' : score
            totalRating += rating
          }
          schedule.professorRating = totalRating / (schedule.length - numTuts)
        })
        calculateGapRating(schedules)
        calculateLunchRating(schedules)
        calculateRating(schedules)
      }
    })
  }
}

function getGapRating(times) {
  if (!times || times.length < 2) return 0
  var rating = 0
  for (let i = 1; i < times.length - 1; i+=2) {
    let start = new Date(`1/1/2016 ${times[i]}`)
    let end = new Date(`1/1/2016 ${times[i+1]}`)
    let elapsed = (end - start) / 60000
    if (elapsed <= 10) {
      ++rating;
    } else if ( elapsed <= 70) {
      --rating;
    }
  }
  return rating
}

function calculateGapRating(schedules) {
  schedules.forEach(schedule => {
    schedule.gapRating = getGapRating(schedule.mTimes) + getGapRating(schedule.tTimes)
    + getGapRating(schedule.wTimes) + getGapRating(schedule.thTimes) + getGapRating(schedule.fTimes)
  })
}

function getLunchRating(times) {
  if (!times || (new Date(`1/1/2016 ${times[0]}`) > new Date("1/1/2016 12:30")) ||
  (new Date(`1/1/2016 ${times[times.length]}`) < new Date("1/1/2016 12:00"))) {
    return 2
  }
  let rating = 0
  for (let i = 1; i < times.length - 1; i+=2) {
    let start = new Date(`1/1/2016 ${times[i]}`)
    let end = new Date(`1/1/2016 ${times[i+1]}`)
    if ((start <= new Date("1/1/2016 14:00")) && (end >= new Date("1/1/2016 11:00"))) {
      let elapsed = (end - start) / 60000
      if (elapsed <= 30) {
        rating = Math.max(0, rating)
      } else {
        rating = Math.max(1, rating)
      }
    }
  }
  return rating
}

function calculateLunchRating(schedules) {
  schedules.forEach(schedule => {
    schedule.lunchRating = getLunchRating(schedule.mTimes) + getLunchRating(schedule.tTimes)
    + getLunchRating(schedule.wTimes) + getLunchRating(schedule.thTimes) + getLunchRating(schedule.fTimes)
  })
}

function calculateRating(schedules) {
  schedules.forEach(schedule => {
    schedule.overallRating = schedule.professorRating * 20 * (professorSlider.value / 5) +
    schedule.lunchRating * (lunchSlider.value / 5) +
    schedule.gapRating * (gapSlider.value / 5)
  })
  schedules.sort((a, b) => b.overallRating - a.overallRating)
  printSchedules(schedules)
}
