function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");

  //
  // *** This styling is an extra step which is likely not required. ***
  //
  // Why is it here? To ensure:
  // 1. the element is able to have focus and selection.
  // 2. if element was to flash render it has minimal visual impact.
  // 3. less flakyness with selection and copying which **might** occur if
  //    the textarea element is not visible.
  //
  // The likelihood is the element won't even render, not even a flash,
  // so some of these are just precautions. However in IE the element
  // is visible whilst the popup box asking the user for permission for
  // the web page to copy to the clipboard.
  //

  // Place in top-left corner of screen regardless of scroll position.
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;

  // Ensure it has a small width and height. Setting to 1px / 1em
  // doesn't work as this gives a negative w/h on some browsers.
  textArea.style.width = '2em';
  textArea.style.height = '2em';

  // We don't need padding, reducing the size if it does flash render.
  textArea.style.padding = 0;

  // Clean up any borders.
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';

  // Avoid flash of white box if rendered for any reason.
  textArea.style.background = 'transparent';


  textArea.value = text;

  document.body.appendChild(textArea);

  textArea.select();

  try {
    var successful = document.execCommand('copy');
    var msg = successful ? 'successful' : 'unsuccessful';
    // console.log('Copying text command was ' + msg);
  } catch (err) {
    // console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

var header =
`GO!
John Smith
My Academics
Course Selection (Undergrad only)
Search for Classes
Enroll
 	My Class Schedule	 	 	|	 	 	Shopping Cart	 	 	|	 	 	Add	 	 	|	 	 	Drop	 	 	|	 	 	Swap	 	 	|	 	 	Edit	 	 	|	 	 	Term Information	 	 	|	 	 	Exam Information
My Class Schedule
List View
Weekly Calendar View
Select Display Option
L
Winter 2018 | Undergraduate | University of Waterloo
Group Box
Collapse section Class Schedule Filter Options Class Schedule Filter Options
Show Enrolled Classes
Show Dropped Classes
Show Waitlisted
`;

var footer =
`Printer Friendly Page
Go to top iconGo to top`

var mclass = `CS 246 - Object-Oriented Software Development
Status	Units	Grading	Deadlines
Enrolled
0.5
Extra to Degree
Academic Calendar Deadlines
Class Nbr	Section	Component	Days & Times	Room	Instructor	Start/End Date
5709
001
LEC
TTh 10:00AM - 11:20AM
PHY   313
Bradley Lushman
01/03/2018 - 04/04/2018
`

function convertDate(date) {
  let hour = parseInt(date.substr(0, date.indexOf(':')));
  let minute = date.substr(date.indexOf(':') + 1);
  if (hour >= 12) {
    return `${(hour === 12) ? 12 : hour - 12}:${minute}PM`
  } else {
    return `${hour}:${minute}AM`
  }
}

function flowConvertCourse(course) {
  let courseProfessor = course.classes[0].instructors[0];
  let commaIndex = courseProfessor.indexOf(',');
  let spaceIndex = courseProfessor.indexOf(' ');
  let lName = courseProfessor.substring(0, commaIndex);
  let fName = spaceIndex === -1 ? courseProfessor.substring(commaIndex + 1) :
  courseProfessor.substring(commaIndex + 1, spaceIndex);
  return `${course.subject} ${course.catalog_number} - ${course.title}
Status	Units	Grading	Deadlines
Enrolled
0.5
Extra to Degree
Academic Calendar Deadlines
Class Nbr	Section	Component	Days & Times	Room	Instructor	Start/End Date
${course.class_number}
${course.section.substr(course.section.indexOf(' ') + 1)}
LEC
${course.classes[0].date.weekdays} ${convertDate(course.classes[0].date.start_time)} - ${convertDate(course.classes[0].date.end_time)}
${course.classes[0].location.building} ${course.classes[0].location.room}
${fName} ${lName}
01/03/2018 - 04/04/2018
`;
}

function flowConvertSchedule(schedule) {
  let courses = '';
  for (let i = 0; i < schedule.length; ++i) {
    courses += flowConvertCourse(schedule[i]);
  }
  return header + courses + footer;
}
