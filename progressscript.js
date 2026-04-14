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
    var studentName = id.split('_').slice(1).join('_');
    var interviewID = id.split('_')[0];
    if(verdict != ""){
        var tdElem = selectElem.parentElement.previousElementSibling;
        var facName = tdElem.innerText;
        if(facName != "") {
            tdElem.classList.remove("inprogress");
            tdElem.classList.add("done");
        }
        var allFacData = localStorage.getItem('panelMembersCatData') ? JSON.parse(localStorage.getItem('panelMembersCatData')) : []; 
        var facID = null;
        var facObj = allFacData.find(function(fac) {
            var facObj = fac.Faculty || fac;
            if(String(facObj.Name) === String(facName)){
                facID = facObj.ROWID;
                return true;
            }
        });
        interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : {};
        var selectedStudent = progressTracker.fetchStudentDetails(studentName);
        var selInterview = null;
        for(var i = 0; i < interviewsCatData.length; i++){
            var iv = interviewsCatData[i].ZS28_Interviews || interviewsCatData[i];
            if(String(iv.Student) === String(selectedStudent.ROWID) && String(iv.Faculty) === String(facID)){
                iv.Verdict = verdict;   // also capital V to match the rest of the code
                selInterview = iv.ROWID;
                break;
            }
        }
        localStorage.setItem('interviewsCatData', JSON.stringify(interviewsCatData));

        progressTracker.updateInterview(selInterview, verdict).then(result => {
            console.log('Interview updated:', result);
        }).catch(error => {
            console.error('Error updating interview:', error);
        });
        progressTracker.showCount();
    }
}
progressTracker.fetchStudentDetails = function(studentName){
    var studentsCatData = JSON.parse(localStorage.getItem('studentsCatData'));
    var parts = studentName.split('_');
    var studentROWID = parts.length > 1 ? parts.slice(1).join('_') : null;
    for(var i = 0; i < studentsCatData.length; i++){
        var s = studentsCatData[i].ZS28_Students;
        // Match by ROWID if available, otherwise fall back to name
        if(studentROWID && String(s.ROWID) === String(studentROWID)){
            return s;
        } else if(!studentROWID && s.Student_Name === studentName){
            return s;
        }
    }
    return null;
}
progressTracker.updateInterview = function(selInterview, verdict) {
    var result;
    const json = {
                "id": selInterview,
                "verdict": verdict
            };
    result = fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/interview/"+selInterview+"", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
    }).then(res => res.json());
  return result;
}
progressTracker.goToConfigPage = function() {
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
    var interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : [];
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
    Object.keys(assignments).forEach(function(student) {
        var maxInterviews = Object.keys(assignments[student]).length;
        var studentInterviews = interviewsCatData.filter(function(entry) {
        var iv = entry.ZS28_Interviews || entry;
        // match by faculty name stored in assignments
        return Object.values(assignments[student]).includes(
            (localStorage.getItem('panelMembersCatData') ? 
                JSON.parse(localStorage.getItem('panelMembersCatData')) : [])
            .find(function(f) { return String((f.Faculty||f).ROWID) === String((entry.ZS28_Interviews||entry).Faculty); })
            ?.Faculty?.Name || ''
        );
    });
    var completedCount = studentInterviews.filter(function(entry) {
        var iv = entry.ZS28_Interviews || entry;
        return iv.Verdict && iv.Verdict !== '' && iv.Verdict !== 'undefined' && iv.Verdict !== 'In Progress';
    }).length;
    if (completedCount === maxInterviews) interviewsDone++;
    });
    var completedStudents = interviewsDone;
    inProgressStudents = inProgressStudents - interviewsDone;
    document.querySelector('#count-done').innerText = completedStudents;
    document.querySelector('#count-inprogress').innerText = inProgressStudents; 
    document.querySelector('#count-pending').innerText = yetToStartStudents;
}   
progressTracker.renderTableBasedOnData = function(data, maxInterviews) {
    var interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : [];
    var studentAssignments = Object.keys(data).forEach(function(key) {
        var studentName = key;
        var interviews = data[key];
        var displayName = studentName.split('_')[0];
        var rowHTML = progressTracker.TEMPLATE_HTML.replace('${0}', displayName);
        var facultyVerdicts = Object.keys(interviews);
        if(facultyVerdicts.length > 0) {
            for(var j=0;j<facultyVerdicts.length;j++) {
                var facultyName = interviews[facultyVerdicts[j]];
                var verdict = "In Progress";

                var ivEntry = interviewsCatData.find(function(entry) {
                    var iv = entry.ZS28_Interviews || entry;
                    var panelData = JSON.parse(localStorage.getItem('panelMembersCatData') || '[]');
                    var facObj = panelData.find(function(f) { return String((f.Faculty||f).ROWID) === String(iv.Faculty); });
                    var facNameInEntry = facObj ? (facObj.Faculty||facObj).Name : '';
                        return facNameInEntry === facultyName && String(iv.Student) === String(
                            (JSON.parse(localStorage.getItem('studentsCatData') || '[]')
                                    .find(function(s) { return s.ZS28_Students.Student_Name === displayName; }) || {ZS28_Students:{ROWID:''}}).ZS28_Students.ROWID
                            );
                    });
                if (ivEntry) {
                    var ivData = ivEntry.ZS28_Interviews || ivEntry;
                    if (ivData.Verdict && ivData.Verdict !== '' && ivData.Verdict !== 'undefined') {
                        verdict = ivData.Verdict;
                    }
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
