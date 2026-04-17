var progressTracker = {};
progressTracker.BASE_URL = "https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function";
progressTracker.fetchData = function() {
    var data = JSON.parse(localStorage.getItem('assignmentsData'));
    return data;
}
progressTracker.isDriveClosed = function() {
    return String(localStorage.getItem('recruitmentDriveStatus') || '').toLowerCase() === 'closed';
}
progressTracker.syncDriveStatus = async function() {
    var driveId = localStorage.getItem('recruitmentDriveId');
    if (!driveId) return;
    try {
        var res = await fetch(progressTracker.BASE_URL + '/recruitment-drive');
        if (!res.ok) return;
        var all = await res.json();
        var matched = (Array.isArray(all) ? all : []).find(function(row) {
            var d = row.RecruitmentDrive || row;
            return String(d.ROWID) === String(driveId);
        });
        if (!matched) return;
        var driveObj = matched.RecruitmentDrive || matched;
        if (driveObj.status) localStorage.setItem('recruitmentDriveStatus', driveObj.status);
    } catch (e) {
        // Keep existing localStorage status if API fails.
    }
}

progressTracker.clearExistingDOM = function() {
    document.querySelectorAll("tr[rel='appended']").forEach(function(row) {
        row.remove();
    }); 
}
progressTracker.TEMPLATE_HTML = "<tr rel='appended'><td>${0} </td>";

progressTracker.FACULTY_VERDICT_TEMPLATE = "<td rel='appended' class='${2}'>${0}</td><td><select id='${3}' disabled onchange='progressTracker.updateColorCode(this)'><option value='In Progress'>In Progress</option value='T'><option value='T'>T</option><option value='C+'>C+</option><option value='C'>C</option><option value='S+'>S+</option><option value='S'>S</option></select></td>";

progressTracker.FINAL_RESULT_TEMPLATE = "<td rel='appended'><select id='result_${1}' onchange='progressTracker.updateFinalResult(this)'><option value=''>--</option><option value='Selected'>Selected</option><option value='Rejected'>Rejected</option><option value='Waitlist'>Waitlist</option></select></td>";

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
    var json = { "id": selInterview };
    if (typeof verdict !== 'undefined') json.verdict = verdict;
    result = fetch(progressTracker.BASE_URL + "/interview/" + selInterview, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(json),
    }).then(res => res.json());
  return result;
}
progressTracker.updateInterviewRemarks = function(textAreaElem) {
    var interviewId = textAreaElem.getAttribute('data-interview-id') || '';
    var remarks = textAreaElem.value || '';
    if (!interviewId) return;

    var interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : [];
    for (var i = 0; i < interviewsCatData.length; i++) {
        var entry = interviewsCatData[i];
        var iv = entry.ZS28_Interviews || entry;
        if (String(iv.ROWID) === String(interviewId)) {
            iv.Remarks = remarks;
            iv.remarks = remarks;
            break;
        }
    }
    localStorage.setItem('interviewsCatData', JSON.stringify(interviewsCatData));

    fetch(progressTracker.BASE_URL + "/interview/" + interviewId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: interviewId, remarks: remarks, Remarks: remarks })
    }).catch(function(error) {
        console.error('Error updating remarks:', error);
    });
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
    // Header is static in grouped-row layout.
    return maxInterviews;
}
progressTracker.showCount = function() {
    var interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : [];
    var assignments = localStorage.getItem('assignmentsData') ? JSON.parse(localStorage.getItem('assignmentsData')) : {};
    var inProgressStudents = 0;
    var yetToStartStudents = 0;
    Object.keys(assignments).forEach(function(student) {
        var interviews = assignments[student];
        var count = 0;
        var interviewKeys = Object.keys(interviews).filter(function(k) { return k !== 'remarks'; });
        var maxInterviews = interviewKeys.length;
        interviewKeys.forEach(function(key) {
            if(interviews[key] == ""){ count++; }
        });
        if(count == maxInterviews){
            yetToStartStudents = yetToStartStudents + 1;
        }else{
            inProgressStudents = inProgressStudents + 1;
        }
    });
    var interviewsDone = 0;
    Object.keys(assignments).forEach(function(student) {
        // Exclude 'remarks' key from count
        var interviewKeys = Object.keys(assignments[student]).filter(function(k) { return k !== 'remarks'; });
        var maxInterviews = interviewKeys.length;
        if (maxInterviews === 0) return;

        // Extract student ROWID from unique key
        var studentROWID = student.includes('_') ? student.split('_').slice(1).join('_') : '';

        // Filter interviews belonging to THIS student only
        var studentInterviews = interviewsCatData.filter(function(entry) {
            var iv = entry.ZS28_Interviews || entry;
            return String(iv.Student) === String(studentROWID);
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
progressTracker.updateFinalResult = function(selectElem) {
    var status = selectElem.value;
    var studentName = selectElem.id.replace('result_', '');  // "Pavithra_13916000000047059"
    var studentROWID = studentName.includes('_') ? studentName.split('_').slice(1).join('_') : '';
    var driveId = localStorage.getItem('recruitmentDriveId');

    var resultsCatData = localStorage.getItem('resultsCatData') ? JSON.parse(localStorage.getItem('resultsCatData')) : [];
    var resultEntry = resultsCatData.find(function(r) {
        var res = r.Results || r;
        return String(res.student) === String(studentROWID);
    });

    if (resultEntry) {
        // PATCH existing result
        var rowid = (resultEntry.Results || resultEntry).ROWID;
        fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/result/" + rowid, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: status })
        }).then(function(res) { return res.json(); }).then(function(data) {
            // Update localStorage
            (resultEntry.Results || resultEntry).status = status;
            localStorage.setItem('resultsCatData', JSON.stringify(resultsCatData));
            console.log('Result updated:', data);
        }).catch(function(err) { console.error('Error updating result:', err); });
    } else {
        // POST new result
        fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student: studentROWID,
                recruitment_drive: driveId,
                status: status
            })
        }).then(function(res) { return res.json(); }).then(function(data) {
            // Add to localStorage so subsequent changes use PATCH
            resultsCatData.push(data[0]);
            localStorage.setItem('resultsCatData', JSON.stringify(resultsCatData));
            console.log('Result created:', data);
        }).catch(function(err) { console.error('Error creating result:', err); });
    }
};
progressTracker.renderTableBasedOnData = function(data, maxInterviews) {
    var interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : [];
    var panelData = JSON.parse(localStorage.getItem('panelMembersCatData') || '[]');
    var isDriveClosed = progressTracker.isDriveClosed();
    var tbody = document.querySelector('#progress-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    Object.keys(data).forEach(function(key) {
        var studentName = key;
        var interviews = data[key] || {};
        var displayName = studentName.split('_')[0];
        var studentROWID = studentName.includes('_') ? studentName.split('_').slice(1).join('_') : '';
        var interviewIds = Object.keys(interviews).filter(function(k) { return k !== 'remarks' && k !== 'remarksByPanel'; });
        var reviewRowCount = Math.max(interviewIds.length, 1);

        for (var j = 0; j < reviewRowCount; j++) {
            var tr = document.createElement('tr');
            tr.setAttribute('rel', 'appended');
            if (j === 0) tr.classList.add('group-start');

            if (j === 0) {
                var studentTd = document.createElement('td');
                studentTd.textContent = displayName;
                studentTd.rowSpan = reviewRowCount + 1; // + final result row
                tr.appendChild(studentTd);
            }

            var interviewId = interviewIds[j] || '';
            var facultyName = interviewId ? (interviews[interviewId] || '') : '';
            var verdict = 'In Progress';
            var remarks = '';

            if (interviewId) {
                var ivEntry = interviewsCatData.find(function(entry) {
                    var iv = entry.ZS28_Interviews || entry;
                    var facObj = panelData.find(function(f) { return String((f.Faculty || f).ROWID) === String(iv.Faculty); });
                    var facNameInEntry = facObj ? (facObj.Faculty || facObj).Name : '';
                    return facNameInEntry === facultyName && String(iv.Student) === String(studentROWID);
                });
                if (ivEntry) {
                    var ivData = ivEntry.ZS28_Interviews || ivEntry;
                    if (ivData.Verdict && ivData.Verdict !== '' && ivData.Verdict !== 'undefined') {
                        verdict = ivData.Verdict;
                    }
                    remarks = ivData.Remarks || ivData.remarks || ivData.remark || '';
                }
            }

            var facultyTd = document.createElement('td');
            facultyTd.setAttribute('rel', 'appended');
            facultyTd.className = (verdict === 'In Progress') ? 'inprogress' : 'done';
            facultyTd.textContent = facultyName || '--';
            tr.appendChild(facultyTd);

            var verdictTd = document.createElement('td');
            verdictTd.setAttribute('rel', 'appended');
            var select = document.createElement('select');
            select.id = (interviewId || 'na') + '_' + studentName;
            select.setAttribute('onchange', 'progressTracker.updateColorCode(this)');
            select.disabled = isDriveClosed || !facultyName || !interviewId || verdict !== 'In Progress';

            ['In Progress', 'T', 'C+', 'C', 'S+', 'S'].forEach(function(v) {
                var option = document.createElement('option');
                option.value = v;
                option.textContent = v;
                if (v === verdict) option.selected = true;
                select.appendChild(option);
            });
            verdictTd.appendChild(select);
            tr.appendChild(verdictTd);

            var remarksTd = document.createElement('td');
            remarksTd.setAttribute('rel', 'appended');
            var remarksTextArea = document.createElement('textarea');
            remarksTextArea.value = remarks;
            remarksTextArea.placeholder = 'Add remarks';
            remarksTextArea.rows = 2;
            remarksTextArea.style.minHeight = '56px';
            remarksTextArea.disabled = isDriveClosed || !facultyName || !interviewId;
            remarksTextArea.setAttribute('data-interview-id', interviewId);
            remarksTextArea.setAttribute('onchange', 'progressTracker.updateInterviewRemarks(this)');
            remarksTd.appendChild(remarksTextArea);
            tr.appendChild(remarksTd);

            tbody.appendChild(tr);
        }

        var resultTr = document.createElement('tr');
        resultTr.setAttribute('rel', 'appended');
        resultTr.classList.add('group-result-row');

        var resultLabelTd = document.createElement('td');
        resultLabelTd.colSpan = 3;
        resultLabelTd.className = 'group-result-label';
        resultLabelTd.textContent = 'Final Result';
        resultTr.appendChild(resultLabelTd);

        var resultsCatData = localStorage.getItem('resultsCatData') ? JSON.parse(localStorage.getItem('resultsCatData')) : [];
        var resultEntry = resultsCatData.find(function(r) {
            var res = r.Results || r;
            return String(res.student) === String(studentROWID);
        });
        var currentStatus = resultEntry ? (resultEntry.Results || resultEntry).status || '' : '';

        var resultTd = document.createElement('td');
        var resultSelect = document.createElement('select');
        resultSelect.id = 'result_' + studentName;
        resultSelect.setAttribute('onchange', 'progressTracker.updateFinalResult(this)');
        ['', 'Selected', 'Rejected', 'Waitlist'].forEach(function(status) {
            var option = document.createElement('option');
            option.value = status;
            option.textContent = status || '--';
            if (status === currentStatus) option.selected = true;
            resultSelect.appendChild(option);
        });
        resultTd.appendChild(resultSelect);
        resultTr.appendChild(resultTd);

        tbody.appendChild(resultTr);
    });

    progressTracker.showCount();
}
