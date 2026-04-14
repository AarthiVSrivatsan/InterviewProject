const app = {
            recruitmentDriveId: '13916000000047009',
            students: [],
            panelMembers: [],
            interviews: [],
            assignments: {},
            verdicts: {},
            finalResults: {},
            currentFilter: 'all'
        };

        function handleFileUpload(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                const lines = text.split('\n').map(line => line.split(',')[0].trim()).filter(line => line);
                const names = lines.map(line => line.trim()).filter(name => name.indexOf("name")==-1);
                names.forEach(name => addToCatalyst(name));
                //app.students = [...new Set([...app.students, ...names])];
                renderStudentList();
            };
            reader.readAsText(file);
        }
        function clearDriveData() {
            const keys = [
                'studentsData',
                'studentsCatData',
                'panelMembersData',
                'panelMembersCatData',
                'interviewsCatData',
                'assignmentsData',
                'interviewsData',
                'verdicts',
                'resultsCatData'
            ];

            keys.forEach(k => localStorage.removeItem(k));
        }
        function addRecDrive() {
            const input = document.getElementById('recDrive');
            const name = input.value.trim();
            if (name) {
                var todaysDate = new Date();
                const json = {
                    "year": todaysDate.getFullYear(),
                    "recruitment_name": name
                };
                fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/recruitment-drive", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(json)
                }).then(response => response.json()).then(data => {
                    console.log("Success:", data);
                    clearDriveData(); // Clear previous drive data to avoid conflicts
                    app.recruitmentDriveId = data[0].RecruitmentDrive.ROWID; // assuming response contains the new recruitment drive ID
                    localStorage.setItem('recruitmentDriveId', data[0].RecruitmentDrive.ROWID);
                    alert('Recruitment Drive created successfully!');
                }).catch((error) => {
                    console.error("Error:", error);
                });
            }
        }
        function addManualStudent() {
            const input = document.getElementById('manualStudentName');
            const name = input.value.trim();
            if (name) {
                //app.students.push(name);
                addToCatalyst(name);
                input.value = '';
                renderStudentList();
            }
        }

        function addPanelMember() {
            const input = document.getElementById('panelMemberName');
            const name = input.value.trim();
            if (name && !app.panelMembers.includes(name)) {
                app.panelMembers.push(name);
                addMemberToCatalyst(name);
                input.value = '';
                renderPanelMemberList();
            }
        }

        function removePanelMember(name) {
            app.panelMembers = app.panelMembers.filter(m => m !== name);
            renderPanelMemberList();
        }

        function renderStudentList() {
            const container = document.getElementById('studentList');
            if (app.students.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = `
                <div class="list-count">Uploaded ${app.students.length} students</div>
                <div style="max-height: 200px; overflow-y: auto; background: #f8fafc; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; margin-top: 0.5rem;">
                    ${app.students.map(name => `<div style="font-size: 0.875rem; color: #475569; margin-bottom: 0.25rem;">${name.split("_")[0]}</div>`).join('')}
                </div>
            `;
            
            localStorage.setItem('studentsData', JSON.stringify(app.students));
        }

        function addToCatalyst(name) {
            var todaysDate = new Date();
            const json = {
                "Student_Name": name,
                "IsFirstLevelThere": false,
                "recruitmentDrive": localStorage.getItem('recruitmentDriveId'),
                "RecruitmentDate": todaysDate.toISOString().split('T')[0]
            };
            fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(json)
            }).then(response => response.json()).then(data => {
                console.log("Success:", data);
                var studArr = localStorage.getItem('studentsCatData') ? JSON.parse(localStorage.getItem('studentsCatData')) : [];
                studArr.push(data[0]);
                app.students.push(name + '_' + data[0].ZS28_Students.ROWID); // Store name with ROWID for uniqueness    
                localStorage.setItem('studentsCatData', JSON.stringify(studArr));
            }).catch((error) => {
                console.error("Error:", error);
            });
        }


        function addMemberToCatalyst(name, isSchoolHead) {
            var todaysDate = new Date();
            const json = {
                "name": name,
                "isSchoolHead": false,
                "RecruitmentDrive": localStorage.getItem('recruitmentDriveId'),
                "RecruitmentDate": todaysDate.toISOString().split('T')[0]
            };
            fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/faculty", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(json)
            }).then(response => response.json()).then(data => {
                var facArr = localStorage.getItem('panelMembersCatData') ? JSON.parse(localStorage.getItem('panelMembersCatData')) : [];
                facArr.push(data[0]);
                localStorage.setItem('panelMembersCatData', JSON.stringify(facArr));
                console.log("Success:", data);
            }).catch((error) => {
                console.error("Error:", error);
            });
        }

        function renderPanelMemberList() {
            const container = document.getElementById('panelMemberList');
            if (app.panelMembers.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = app.panelMembers.map(member => `
                <div class="list-item">
                    <span class="list-item-name">${member}</span>
                    <button class="btn-danger" onclick="removePanelMember('${member}')">✕</button>
                </div>
            `).join('');
            localStorage.setItem('panelMembersData', JSON.stringify(app.panelMembers));
        }

        function goToConfig() {
            goToInterviewAssignPage();
        }

        function initializeConfig() {
            app.students = app.students.length > 0 ? app.students : JSON.parse(localStorage.getItem('studentsData') || '[]');
            app.panelMembers = app.panelMembers.length > 0 ? app.panelMembers : JSON.parse(localStorage.getItem('panelMembersData') || '[]');
            if (app.students.length === 0 || app.panelMembers.length === 0) {
                alert('Please upload students and add panel members');
                return;
            }
            // Fresh session: build default interview rounds and empty assignment slots
            app.interviews = [
                { id: '1', name: 'Interview-1', isHead: false },
                { id: '2', name: 'Interview-2', isHead: false },
                { id: '3', name: 'Head Interview', isHead: true, interviewer: 'Uma' }
            ];
            // If assignments already exist in localStorage (e.g. loaded from loadDrive.html),
            // restore them directly — don't wipe the faculty selections.
            var catalystData = localStorage.getItem('interviewsCatData');
            var studentsCatData = JSON.parse(localStorage.getItem('studentsCatData') || '[]');
            var panelMembersCatData = JSON.parse(localStorage.getItem('panelMembersCatData') || '[]');
            if (catalystData) {
                var interviewsCatData = JSON.parse(catalystData);

                // Group interviews by student
                var byStudent = {};
                interviewsCatData.forEach(function(ivtemp) {
                    var iv = ivtemp.ZS28_Interviews;
                    var sId = String(iv.Student);
                    if (!byStudent[sId]) byStudent[sId] = [];
                    byStudent[sId].push(iv);
                });

                // Find max number of rounds across all students
                var maxRounds = 0;
                Object.keys(byStudent).forEach(function(sId) {
                    if (byStudent[sId].length > maxRounds) maxRounds = byStudent[sId].length;
                });

                // Build app.interviews with simple round ids '1','2',...
                app.interviews = [];
                for (var r = 1; r <= maxRounds; r++) {
                    app.interviews.push({ id: String(r), name: 'Interview-' + r, isHead: false });
                }
                app.interviews.push({ id: 'head', name: 'Head Interview', isHead: true, interviewer: 'Uma' });

                Object.keys(byStudent).forEach(function(sId) {
                    var stuObj = studentsCatData.find(function(s) { return String(s.ZS28_Students.ROWID) === sId; });
                    if (!stuObj) return;
                    var sName = stuObj.ZS28_Students.Student_Name + '_' + sId;
                    app.assignments[sName] = {};

                    byStudent[sId].forEach(function(iv, idx) {
                         var facObj = panelMembersCatData.find(function(f) { return String(f.Faculty.ROWID) === String(iv.Faculty); });
                         app.assignments[sName][String(idx + 1)] = facObj ? facObj.Faculty.Name : '';

                         if (iv.Verdict && iv.Verdict !== '' && iv.Verdict !== 'undefined') {
                            iv.Verdict = iv.Verdict;  // already there, just ensure it persists
                        }
                    });
                    localStorage.setItem('interviewsCatData', JSON.stringify(interviewsCatData));
                });
            } else {
                app.students.forEach(student => {
                    app.assignments[student] = {};
                    app.interviews.forEach(interview => {
                        app.assignments[student][interview.id] = '';
                    });
                });
            }
            localStorage.setItem('assignmentsData', JSON.stringify(app.assignments));
            localStorage.setItem('interviewsData', JSON.stringify(app.interviews));
            return;
        }

        function addInterviewRound() {
            const newId = Date.now().toString();
            const roundNum = app.interviews.filter(i => !i.isHead).length + 1;
            app.interviews.splice(app.interviews.length - 1, 0, {
                id: newId,
                name: `Interview-${roundNum}`,
                isHead: false
            });

            Object.keys(app.assignments).forEach(function(student) {
                app.assignments[student][newId] = '';
            });

            renderConfigView();
            switchView('configView');
        }

        function removeInterviewRound(roundId) {
            app.interviews = app.interviews.filter(i => i.id !== roundId);
            app.students.forEach(student => {
                delete app.assignments[student][roundId];
            });
            renderConfigView();
        }

function updateInterviewRound(student, roundId, newName, elem) {
    // ensure assignments object for student exists
    if (!app.assignments[student]) app.assignments[student] = {};

    // prevent assigning same interviewer to multiple rounds for the same student
    for (const rid in app.assignments[student]) {
        if (!Object.prototype.hasOwnProperty.call(app.assignments[student], rid)) continue;
        // allow updating the same round to the same value
        //if (rid !== roundId && Object.keys(app.assignments[student])[rid] === newName && newName !== '') {
        if (rid !== roundId && app.assignments[student][rid] === newName && newName !== '') {
            alert('Interviewer already assigned in another round. Please choose a different interviewer.');
            elem.value = "";
            return;
        }
    }
    if(newName === "Uma"){
        alert('Uma can only be assigned to the Head Interview round. Please choose a different interviewer.');
        elem.value = "";
        return;
    }

    app.assignments[student][roundId] = newName;
    assignInterview(student, newName).then(result => {
        console.log('Interview assignment updated:', result);
        var finalResult = JSON.parse(localStorage.getItem('interviewsCatData') || '[]');
        finalResult.push(result[0]);
        localStorage.setItem('interviewsCatData', JSON.stringify(finalResult));
    }).catch(error => {
        console.error('Error updating interview assignment:', error);
    });
}

async function assignInterview(studentName, facName){
    studentsCatData = JSON.parse(localStorage.getItem('studentsCatData'));
    facData = JSON.parse(localStorage.getItem('panelMembersCatData'));
    var selectedStudent = null;
    var selectedFac = null;
    var selectedStudent = studentName.includes('_') ? studentName.split('_').slice(1).join('_') : null;
    if (!selectedStudent) {
        for(var i = 0; i < studentsCatData.length; i++){
        if((studentsCatData[i].ZS28_Students || studentsCatData[i]).Student_Name === studentName){
            selectedStudent = (studentsCatData[i].ZS28_Students || studentsCatData[i]).ROWID;
            break;
        }   
    }
    }
    for(var j = 0; j < facData.length; j++){
        if((facData[j].Faculty || facData[j]).Name === facName){
            selectedFac = (facData[j].Faculty || facData[j]).ROWID;
            break;
        }
    }
    const json = {
                "student_id": selectedStudent,
                "faculty_id": selectedFac,
                "recruitment_drive_id": localStorage.getItem('recruitmentDriveId'),
                "recruitment_date": new Date().toISOString().split('T')[0],
                "is_school_head_interview": false
            };
    let res = await fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/interview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  });
  let result = await res.json();

  return result;
}
function renderConfigView() {
    var interviewsCatData = localStorage.getItem('interviewsCatData') ? JSON.parse(localStorage.getItem('interviewsCatData')) : [];
    const thead = document.getElementById('configTableHead');
    const tbody = document.getElementById('configTableBody');
    app.interviews = app.interviews.length > 0 ? app.interviews : JSON.parse(localStorage.getItem('interviewsData') || '[]');
    app.assignments = Object.keys(app.assignments).length > 0 ? app.assignments : JSON.parse(localStorage.getItem('assignmentsData') || '{}');
    thead.innerHTML = `
        <th>Student Name</th>
        ${app.interviews.map(interview => `
            <th>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
                    <span>${interview.name}</span>
                    ${!interview.isHead && app.interviews.filter(i => !i.isHead).length > 1 ? `
                        <button class="btn-danger" style="padding: 0.25rem; width: 1.5rem; height: 1.5rem; font-size: 0.75rem;" onclick="removeInterviewRound('${interview.id}')">✕</button>
                    ` : ''}
                </div>
            </th>
        `).join('')}
        <th>Remarks</th>
        <th>Result</th>
    `;
    tbody.innerHTML = app.students.map(student => {
        var keyLength = Object.keys(app.interviews).length;
        var initialIdx = 0;
        const cells = app.interviews.map(interview => {
            // build cell content based on interview properties
            var idx = initialIdx;
            if (interview.isHead && interview.interviewer) {
                return `<td>
                            <input type="text" value="${interview.interviewer}" disabled style="background: #f1f5f9; cursor: not-allowed;">
                        </td>`;
            }

            //var facIdx = Object.keys(app.assignments[student])[idx];
            var facIdx = interview.id;
            // helper to build options list
            const options = app.panelMembers.map(member => {
                const selected = (app.assignments[student] && app.assignments[student][facIdx] === member) ? 'selected' : '';
                return `<option value="${member}" ${selected}>${member}</option>`;
            }).join('');
            var facName = (app.assignments && app.assignments[student] && app.assignments[student][facIdx]) ? app.assignments[student][facIdx] : '';
            //var thisVerdict = (verdicts[student] && Object.keys(verdicts[student])[idx]) ? Object.keys(verdicts[student])[idx] : '';    
            //var thisVerdict = "C";

            var thisVerdict = '';
            var panelData = JSON.parse(localStorage.getItem('panelMembersCatData') || '[]');
            var studentsData = JSON.parse(localStorage.getItem('studentsCatData') || '[]');
            var ivEntry = interviewsCatData.find(function(entry) {
                var iv = entry.ZS28_Interviews || entry;
                var studentROWID = student.includes('_') ? student.split('_').slice(1).join('_') : '';
                var studentObj = studentsData.find(function(s) {
                     return String((s.ZS28_Students || s).ROWID) === String(studentROWID);
                });

                var studentId = (studentObj && studentObj.ZS28_Students.ROWID) || '';
                var facultyObj = panelData.find(function(f) {
                    return String((f.Faculty || f).ROWID) === String(iv.Faculty);
                });
                var facultyName = (facultyObj && facultyObj.Faculty.Name) || '';
                return String(iv.Student) === String(studentId) &&app.assignments[student] &&app.assignments[student][facIdx] === facultyName;
            });
            if (ivEntry) {
                var ivData = ivEntry.ZS28_Interviews || ivEntry;
                if (ivData.Verdict && ivData.Verdict !== '' && ivData.Verdict !== 'undefined') {
                    thisVerdict = ivData.Verdict;
                }
            }
            initialIdx++;
            if (thisVerdict != "") {
            
                return `<td>
                            <select disabled value="${facName}" onchange='updateInterviewRound(${JSON.stringify(student)}, ${JSON.stringify(interview.id)}, this.value, this)'>
                                <option value="">Select Interviewer</option>
                                ${options}
                            </select>
                        </td>`;
            }

            return `<td>
                        <select value="${facName}" onchange='updateInterviewRound(${JSON.stringify(student)}, ${JSON.stringify(interview.id)}, this.value, this)'>
                            <option value="">Select Interviewer</option>
                            ${options}
                        </select>
                    </td>`;
        }).join('');

        const remarks = (app.assignments[student] && app.assignments[student]['remarks']) ? String(app.assignments[student]['remarks']).replace(/"/g, '&quot;') : '';
        var displayName = student.includes('_') ? student.split('_')[0] : student;
        var resultsCatData = JSON.parse(localStorage.getItem('resultsCatData') || '[]');
        var studentROWID = student.includes('_') ? student.split('_').slice(1).join('_') : '';
        var resultEntry = resultsCatData.find(function(r) {
                return String((r.Results||r).student) === String(studentROWID);
        });
        var resultStatus = resultEntry ? (resultEntry.Results||resultEntry).status || '--' : '--';
        var resultClass = resultStatus === 'Selected' ? 'status-selected' : 
                  resultStatus === 'Rejected' ? 'status-rejected' : 
                  resultStatus === 'Waitlist' ? 'status-waiting' : '';
        return `<tr>
                    <td>${displayName}</td>
                    ${cells}
                    <td class="${resultClass}">
                        ${resultStatus}
                    </td> 
                    <td>
                        <input type="text" placeholder="Add remarks" value="${remarks}" onchange="" style="width: 100%; padding: 0.25rem; border: 1px solid #cbd5e1; border-radius: 0.375rem;">
                    </td>
                </tr>`;
    }).join('');
}
   
        function goToSetup() {
            switchView('setupView');
        }
        function goToEvaluation() {
            localStorage.setItem('assignmentsData', JSON.stringify(app.assignments));
            localStorage.setItem('interviewsData', JSON.stringify(app.interviews));
            window.location = './progress.html';
        }
        function resetApp() {
            app.students = [];
            app.panelMembers = [];
            app.interviews = [];
            app.assignments = {};
            app.verdicts = {};
            app.finalResults = {};
            app.currentFilter = 'all';

            document.getElementById('csvFile').value = '';
            document.getElementById('manualStudentName').value = '';
            document.getElementById('panelMemberName').value = '';
            renderStudentList();
            renderPanelMemberList();

            switchView('setupView');
        }

        function switchView(viewId) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
        }
        function goToInterviewAssignPage() {
            window.location = './interviewassign.html';
        }
