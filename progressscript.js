var progressTracker = {};
progressTracker.fetchData = function() {
    var data = JSON.parse(localStorage.getItem('assignmentsData'));
    return data;
}

progressTracker.clearExistingDOM = function() {
    document.querySelectorAll("tr[rel='appended']").forEach(function(row) {
        row.remove();
    }); 
}
progressTracker.TEMPLATE_HTML = "<tr rel='appended'><td>${0} </td>";

progressTracker.FACULTY_VERDICT_TEMPLATE = "<td rel='appended' class='${2}'>${0}</td><td><select id='${3}' disabled onchange='progressTracker.updateColorCode(this)'><option value='In Progress'>In Progress</option value='T'><option value='T'>T</option><option value='C+'>C+</option><option value='C'>C</option><option value='S+'>S+</option><option value='S'>S</option></select></td>";

progressTracker.FINAL_RESULT_TEMPLATE = "<td rel='appended'>${0}</td>";

progressTracker.END_TR = "</tr>";

progressTracker.updateColorCode = function(selectElem) {
    var verdict = selectElem.value;
    var id = selectElem.id;
    var studentName = id.split('_')[1];
    var interviewID = id.split('_')[0];
    if(verdict != ""){
        var tdElem = selectElem.parentElement.previousElementSibling;
        var facName = tdElem.innerText;
        if(facName != "") {
            tdElem.classList.remove("inprogress");
            tdElem.classList.add("done");
        }
        if(!app.verdicts[studentName]){
            app.verdicts[studentName] = {};
        }
        app.verdicts[studentName][interviewID] = verdict;
        progressTracker.showCount();
    }
}

progressTracker.goToConfigPage = function() {
    localStorage.setItem('verdicts', JSON.stringify(app.verdicts));
    window.location.href = "interviewassign.html";
}
progressTracker.findHighestNumberOfInterviews = function(data) {
    var students = data.students;
    var maxInterviews = 0;
    for(var i=0;i<students.length; i++) {
        var eachStudent = students[i];
        var facultyVerdicts = eachStudent.interviews;
        if(facultyVerdicts.length > maxInterviews) {
            maxInterviews = facultyVerdicts.length;
        }
    }
    return maxInterviews;
}

progressTracker.renderHeader = function(maxInterviews) {
    var firstRowHTML = document.querySelector('#addAfterTh');
    var secondRowHTML = document.querySelector('#addAfterThSpan');
    for(var i=1;i<maxInterviews;i++) {
        var thFaculty = document.createElement('th');
        thFaculty.className = "header-span";
        thFaculty.colSpan = "2";
        thFaculty.innerText = "Faculty and Verdict";
        firstRowHTML.after(thFaculty);
        var thFacultyName = document.createElement('th');
        thFacultyName.innerText = "FacultyName";
        secondRowHTML.appendChild(thFacultyName);
        var thVerdict = document.createElement('th');
        thVerdict.innerText = "Verdict";
        secondRowHTML.after(thVerdict);
    }
}
progressTracker.showCount = function() {
    var verdicts = localStorage.getItem('verdicts') ? JSON.parse(localStorage.getItem('verdicts')) : {};
    var assignments = localStorage.getItem('assignmentsData') ? JSON.parse(localStorage.getItem('assignmentsData')) : {};
    var inProgressStudents = 0;
    var yetToStartStudents = 0;
    Object.keys(assignments).forEach(function(student) {
        var interviews = assignments[student];
        var maxInterviews = Object.keys(interviews).length;
        var count = 0;
        Object.keys(interviews).forEach(function(key) {
            if(interviews[key] == ""){
                count++;
            }
        });
        if(count == maxInterviews){
            yetToStartStudents = yetToStartStudents + 1;
        }else{
            inProgressStudents = inProgressStudents + 1;
        }
    });
    var interviewsDone = 0;
    Object.keys(verdicts).forEach(function(student) {
        var interviews = verdicts[student];
        var maxInterviews = Object.keys(assignments[student]).length;
        var completedInterviews = Object.keys(interviews).length;
        if(maxInterviews == completedInterviews) {
            interviewsDone = interviewsDone + 1;
        }
    });
    var completedStudents = interviewsDone;
    inProgressStudents = inProgressStudents - interviewsDone;
    document.querySelector('#count-done').innerText = completedStudents;
    document.querySelector('#count-inprogress').innerText = inProgressStudents; 
    document.querySelector('#count-pending').innerText = yetToStartStudents;
}   
progressTracker.renderTableBasedOnData = function(data, maxInterviews) {
    var studentAssignments = Object.keys(data).forEach(function(key) {
        var studentName = key;
        var interviews = data[key];
        var rowHTML = progressTracker.TEMPLATE_HTML.replace('${0}', studentName);
        var facultyVerdicts = Object.keys(interviews);
        if(facultyVerdicts.length > 0) {
            for(var j=0;j<facultyVerdicts.length;j++) {
                var facultyName = interviews[facultyVerdicts[j]];
                var verdict = "In Progress";
                app.verdicts = localStorage.getItem('verdicts') ? JSON.parse(localStorage.getItem('verdicts')) : {};
                if(app.verdicts[studentName] && app.verdicts[studentName][facultyVerdicts[j]]) {
                    verdict = app.verdicts[studentName][facultyVerdicts[j]];
                }
                var domToAppend = progressTracker.FACULTY_VERDICT_TEMPLATE;
                className = (verdict == "In Progress") ? "inprogress" : "done";
                if(facultyName != "") {
                    domToAppend = domToAppend.replace('${2}', className);
                    domToAppend = domToAppend.replace('${3}', facultyVerdicts[j] + '_' + studentName);
                    domToAppend = domToAppend.replace("value='"+verdict+"'", "value='"+verdict+"' selected");
                    if(verdict == "In Progress") {
                        domToAppend = domToAppend.replace('disabled', "");
                    }
                }
                rowHTML += domToAppend.replace('${0}', facultyName);
            }
            rowHTML += progressTracker.FINAL_RESULT_TEMPLATE.replace('${0}', "--");
            rowHTML += progressTracker.END_TR;
        }
        document.querySelector('#progress-table').innerHTML += rowHTML;
        progressTracker.showCount();
    });
}