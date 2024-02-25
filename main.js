const minDOB = new Date(1900, 0, 1);
const today = new Date();
const minStartYear = 2000;
const tbody = document.getElementById("tbody");
const newStudent = document.getElementById("newstudent");

let studentsArray = [];
let numberOfStudents = 0;
let deleteButtonDisplay = "none";

let buttonNewStudent = document.getElementById("buttonNewStudent");
let btnSave = document.getElementById("btnsave");
let btnCancel = document.getElementById("btncancel");

let btnDelete = document.getElementById("btndelete");
let btnDelCancel = document.getElementById("btndelcancel");

let nameOfStudentFilter = document.getElementById("namefilter");
let facultyFilter = document.getElementById("facultyfilter");
let dobFilter = document.getElementById("dobfilter");
let startYearFilter = document.getElementById("startyearfilter");
let filterName = "", filterFaculty = "", filterDOB = null, filterStartYear = "";

let nameOfStudentTitle = document.getElementById("nametitle");
let facultyTitle = document.getElementById("facultytitle");
let dobTitle = document.getElementById("dobtitle");
let startYearTitle = document.getElementById("startyeartitle");

let nameOfStudentInput = document.getElementById("name");
let facultyInput = document.getElementById("faculty");
let dobInput = document.getElementById("dob");
let startYearInput = document.getElementById("startyear");

function emptyInput() {
  nameOfStudentInput.value = "";
  facultyInput.value = "";
  dobInput.value = "";
  startYearInput.value = "";
}

function checkData() {
  let noErrorInput = true;

  if (nameOfStudentInput.value.trim() == "") {
    alert("Name not filled");
    noErrorInput = false;
  }
  if (facultyInput.value.trim() == "") {
    alert("Department not filled");
    noErrorInput = false;
  }
  if (dobInput.value == "" || dobInput.valueAsDate < minDOB || dobInput.valueAsDate > today) {
    alert("Incorrect date. Should be between 01.01.1900 and the current date");
    noErrorInput = false;
  }
  if (startYearInput.value < minStartYear || startYearInput.value > today.getFullYear()) {
    alert("Incorrect the first year of study. Should be between 2000 and the current year");
    noErrorInput = false;
  };
  return noErrorInput;
};

function createStudent(studentsArray, i) {
  let trTbody = document.createElement("tr");
  trTbody.id = studentsArray[i].id;
  let td1Tbody = document.createElement("td");
  let td2Tbody = document.createElement("td");
  let td3Tbody = document.createElement("td");
  let td4Tbody = document.createElement("td");

  let deleteButton = document.createElement('button');
  deleteButton.classList.add('btn', 'btn-danger', 'deletebutton');
  deleteButton.textContent = 'Delete';
  deleteButton.style.display = deleteButtonDisplay;

  td1Tbody.textContent = studentsArray[i].name;
  td2Tbody.textContent = studentsArray[i].faculty;

  // дата рождения и возраст
  let dobnow = new Date(today.getFullYear(), studentsArray[i].birthday.getMonth(), studentsArray[i].birthday.getDate()); //ДР в текущем году
  let age = today.getFullYear() - studentsArray[i].birthday.getFullYear();
  if (today < dobnow) { age = age - 1; };
  td3Tbody.textContent = studentsArray[i].birthday.toLocaleDateString('en-AU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }) + " (" + age + " years)";

  // годы обучения и номер курса
  let years = today.getFullYear() - studentsArray[i].studyStart;
  if (today.getMonth() >= 9) { years++ };
  let yearOfStudy = " (" + years + " year)";
  if (years > 4) { yearOfStudy = " (finished)" };
  td4Tbody.textContent = studentsArray[i].studyStart + "-" + (Number(studentsArray[i].studyStart) + 4) + yearOfStudy;

  // trTbody.append(thTbody);
  trTbody.append(td1Tbody);
  trTbody.append(td2Tbody);
  trTbody.append(td3Tbody);
  trTbody.append(td4Tbody);
  trTbody.append(deleteButton);
  tbody.append(trTbody);

  return { trTbody, deleteButton };
}

// обработчик на кнопку Удалить
function pressButtonDelete(student) {
  student.deleteButton.addEventListener('click', function () {
    if (confirm('Are you sure?')) {
      student.trTbody.remove();
      numberOfStudents--;
      for (let i = 0; i < studentsArray.length; i++) {
        if (student.trTbody.id == studentsArray[i].id) {
          studentsArray.splice(i, 1);

          const response = fetch(`http://localhost:3000/api/students/${student.trTbody.id}`, {
            method: 'DELETE'
          });

          break;
        }
      }
    }
  });
}

// обработка сортировки и фильтров
function arrayToHTML(name, needsort) {
  let temparray = studentsArray.slice(0);
  if (needsort) {
    temparray = studentsArray.sort(function (a, b) {
      let nameA = a[name];
      let nameB = b[name];
      if (name == "name" || name == "faculty") {
        nameA = nameA.toUpperCase();
        nameB = nameB.toUpperCase();
      }
      if (nameB > nameA) {
        return -1;
      }
      if (nameA < nameB) {
        return 1;
      }
      return 0;
    });
  }

  tbody.innerHTML = "";

  temparray = temparray.filter(e =>
    (filterName == "" || e.name.toLowerCase().includes(filterName.toLowerCase()))
    && (filterFaculty == "" || e.faculty.toLowerCase().includes(filterFaculty.toLowerCase()))
    && (filterDOB == null || Date.parse(e.birthday) == Date.parse(filterDOB))
    && (filterStartYear == "" || e.studyStart == filterStartYear));

  for (let i = 0; i < temparray.length; i++) {
    let student = createStudent(temparray, i);
    pressButtonDelete(student);
  }
}

async function loadStudents() {
  // сначала считываем существующий список студентов в массив и создаем dom-элементы

  const response = await fetch(`http://localhost:3000/api/students`);
  studentsArray = await response.json();

  for (let i = 0; i < studentsArray.length; i++) {
    studentsArray[i].birthday = new Date(studentsArray[i].birthday);
    let student = createStudent(studentsArray, i);
    pressButtonDelete(student);
    numberOfStudents++;
  };
}

// НАЧАЛО
loadStudents();

// включить добавление студентов
buttonNewStudent.addEventListener('click', function () {
  buttonNewStudent.disabled = true;
  btnSave.disabled = false;
  btnCancel.disabled = false;
  newStudent.style.display = "table-row";
});

// схранить нового студента
btnSave.addEventListener('click', async function () {

  if (checkData()) {

    const response = await fetch(
      'http://localhost:3000/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameOfStudentInput.value.trim(),
        surname: 'no',
        lastname: 'no',
        birthday: dobInput.valueAsDate,
        studyStart: startYearInput.value,
        faculty: facultyInput.value.trim()
      }
      )
    });
    const newStudent = await response.json();

    studentsArray.push({ id: newStudent.id, name: nameOfStudentInput.value, faculty: facultyInput.value, birthday: dobInput.valueAsDate, studyStart: startYearInput.value });
    let student = createStudent(studentsArray, numberOfStudents++);
    student.trTbody.id = newStudent.id;
    pressButtonDelete(student);
    emptyInput();
  }
});

// отменить добавление студентов
btnCancel.addEventListener('click', function () {
  buttonNewStudent.disabled = false;
  btnSave.disabled = true;
  btnCancel.disabled = true;
  newStudent.style.display = "none";
  emptyInput();
});

// включить режим удаления
btnDelete.addEventListener('click', function () {
  buttonNewStudent.disabled = true;
  btnSave.disabled = true;
  btnCancel.disabled = true;

  let deleteButtonClass = document.querySelectorAll(".deletebutton");
  for (let elem of deleteButtonClass) {
    elem.style.display = "inline-block";
  }
  deleteButtonDisplay = "inline-block";

  newStudent.style.display = "none";
  btnDelete.disabled = true;
  btnDelCancel.disabled = false;
});

// отключить режим удаления
btnDelCancel.addEventListener('click', function () {
  buttonNewStudent.disabled = false;
  btnSave.disabled = true;
  btnCancel.disabled = true;

  let deleteButtonClass = document.querySelectorAll(".deletebutton");
  for (let elem of deleteButtonClass) {
    elem.style.display = "none";
  }
  deleteButtonDisplay = "none";

  newStudent.style.display = "none";
  btnDelete.disabled = false;
  btnDelCancel.disabled = true;
});

// сортировка
nameOfStudentTitle.addEventListener('click', function () {
  arrayToHTML("name", true);
});
facultyTitle.addEventListener('click', function () {
  arrayToHTML("faculty", true);
});
dobTitle.addEventListener('click', function () {
  arrayToHTML("birthday", true);
});
startYearTitle.addEventListener('click', function () {
  arrayToHTML("studyStart", true);
});

// фильтры
nameOfStudentFilter.addEventListener('change', function () {
  filterName = nameOfStudentFilter.value.trim();
  arrayToHTML("name", false);
});
facultyFilter.addEventListener('change', function () {
  filterFaculty = facultyFilter.value.trim();
  arrayToHTML("faculty", false);
});
dobFilter.addEventListener('change', function () {
  filterDOB = dobFilter.valueAsDate;
  arrayToHTML("birthday", false);
});
startYearFilter.addEventListener('change', function () {
  filterStartYear = startYearFilter.value;
  arrayToHTML("studyStart", false);
});

