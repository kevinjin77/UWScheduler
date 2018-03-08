const uwApiKey = "a0fa5a0445627c840d18a3cf30d89995";
const googleApiKey = "AIzaSyDbxPyrNeLrgCJE_Fip-jqXcIJj3BzTLEw";
var done = false;

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

function isConflict(course1, course2) {
  if (!(course1.section.includes("LEC") && course2.section.includes("LEC"))) {
    return true
  }
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

function getTermFromQuest(scheduleString) {
  let start = scheduleString.indexOf('L\n') + 2;
  let end = scheduleString.indexOf('| Undergraduate |') - 1;
  term = termMap.get(scheduleString.slice(start, end));
}

function getCoursesFromQuest(scheduleString, courseArr) {
  let start = scheduleString.indexOf('Show Waitlisted Classes') + 24;
  let end = scheduleString.indexOf('Printer Friendly Page') - 1;
  let coursesString = scheduleString.slice(start, end);
  var lines = coursesString.split('\n');
  for (let i = 0; i < lines.length; i += 14) {
    let courseString = lines[i].substr(0, lines[i].indexOf('-')-1).replace(/\s/g, '');
    let firstDigit = courseString.search(/\d/);
    courseArr.push([courseString.substring(0, firstDigit), courseString.substring(firstDigit)]);
  }
}

function submit() {
  done = false;
  var myNode = document.getElementById("schedules");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }

  document.getElementById("loading").style.display = 'block'
  var courseArr = [];
  if (inputMode === 'manual') {
    term = document.getElementById('termNumber').value;
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
      courses.push(validClasses)
      if (validClasses.length === 0) {
        alert(`Error! ${courseArr[i][0]}${courseArr[i][1]} is not being offered this term!`)
        error = true
      }
    }).then(() => {
      if (!error) {
        generateSchedules(courses)
      } else {
        document.getElementById("loading").style.display = 'none'
      }
    })
  }
}

function isClassValid(myClass) {
  return !(!morning.checked && myClass.classes[0].date.start_time === '08:30')  &&
  !(!night.checked && new Date(`1/1/2016 ${myClass.classes[0].date.start_time}`) >= new Date("1/1/2016 18:00")) &&
  !(myClass.campus !== 'UW U') && (myClass.section.includes("LEC"))
}

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
  let schedules = cartesianProduct(courseArr).filter(schedule =>
    isScheduleValid(schedule)
  )
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

var startDate;
var endDate;
function getTermDates(schedules) {
  var settings = {
    "async": true,
    "crossDomain": true,
    "url": `https://api.uwaterloo.ca/v2/terms/${term}/importantdates.json?key=${uwApiKey}`,
    "method": "GET"
  }

  $.ajax(settings).then(function (response) {
    startDate = response.data.find(el =>
      el.title === 'Lectures or classes begin at UWaterloo').start_date;
    endDate = response.data.find(el =>
      el.title === 'Lectures or classes end').start_date;
  }).then(() => {
    calculateProfessorRating(schedules)
  })
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
      "url": `https://www.ratemyprofessors.com/find/professor/?&page=1&sid=1490&queryoption=TEACHER&queryBy=teacherName&query=${fName}+${lName}`,
      "method": "GET",
      "error": function () {
        alert("Oops! Something went wrong. Please try again later.")
      }
    }

    $.ajax(settings).then(function (response) {
      noRes = (response.professors.length === 0)
      let rating = noRes ? -1 : parseFloat(response.professors[0].overall_rating)
      profsRatings.push([profs[i], rating])
    }).then(() => {
      if (profsRatings.length === profs.length && !done) {
        done = true;
        let profsMap = new Map(profsRatings)
        schedules.forEach((schedule) => {
          let totalRating = 0
          for (let i = 0; i < schedule.length; ++i) {
            let score = profsMap.get(schedule[i].classes[0].instructors[0])
            let rating = (!score || score === -1) ? 2 : score
            schedule[i].classes[0].rating = (!score || score === -1) ? 'Not Found' : score
            totalRating += rating
          }
          schedule.professorRating = totalRating / schedule.length
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
    if (elapsed > 10 && elapsed <= 70) {
      --rating
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
      } else if (elapsed <= 70) {
        rating = Math.max(1, rating)
      } else {
        rating = Math.max(2, rating)
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
    schedule.gapRating * 0.5 * (gapSlider.value / 5)
  })
  schedules.sort((a, b) => b.overallRating - a.overallRating)
  printSchedules(schedules)
}
