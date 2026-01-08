const app = {
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
                app.students = [...new Set([...app.students, ...names])];
                renderStudentList();
            };
            reader.readAsText(file);
        }

        function addManualStudent() {
            const input = document.getElementById('manualStudentName');
            const name = input.value.trim();
            if (name && !app.students.includes(name)) {
                app.students.push(name);
                input.value = '';
                renderStudentList();
            }
        }

        function addPanelMember() {
            const input = document.getElementById('panelMemberName');
            const name = input.value.trim();
            if (name && !app.panelMembers.includes(name)) {
                app.panelMembers.push(name);
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
                    ${app.students.map(name => `<div style="font-size: 0.875rem; color: #475569; margin-bottom: 0.25rem;">${name}</div>`).join('')}
                </div>
            `;
            
            localStorage.setItem('studentsData', JSON.stringify(app.students));
            debugger;
            addToCatalyst();
        }

        function addToCatalyst() {
            var json = {   
    "Student_Name": "Pavithra",
    "IsFirstLevelThere": false,
    "recruitmentDrive": "13916000000047009",
    "RecruitmentDate": "2026-01-08"
};
            fetch("https://zsinterviews-60051110991.development.catalystserverless.in/server/zs_interviews_function/student", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(json)
            }).then(response => response.json()).then(data => {
                debugger;
                console.log("Success:", data);
            }).catch((error) => {
                debugger;
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
            app.students = app.students.length > 0 ? app.students : JSON.parse(localStorage.getItem('studentsData'));
            app.panelMembers = app.panelMembers.length > 0 ? app.panelMembers : JSON.parse(localStorage.getItem('panelMembersData') || '[]');
            if (app.students.length === 0 || app.panelMembers.length === 0) {
                alert('Please upload students and add panel members');
                return;
            }

            app.interviews = [
                { id: '1', name: 'Interview-1', isHead: false },
                { id: '2', name: 'Interview-2', isHead: false },
                { id: '3', name: 'Head Interview', isHead: true, interviewer: 'Uma' }
            ];

            app.students.forEach(student => {
                app.assignments[student] = {};
                app.interviews.forEach(interview => {
                    app.assignments[student][interview.id] = '';
                });
            });
        }

        function addInterviewRound() {
            const newId = Date.now().toString();
            const roundNum = app.interviews.filter(i => !i.isHead).length + 1;
            app.interviews.splice(app.interviews.length - 1, 0, {
                id: newId,
                name: `Interview-${roundNum}`,
                isHead: false
            });

            app.students.forEach(student => {
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
        if (rid !== roundId && app.assignments[student][rid] === newName && newName !== '') {
            alert('Interviewer already assigned in another round. Please choose a different interviewer.');
            elem.value = "";
            return;
        }
    }

    app.assignments[student][roundId] = newName;
}
function renderConfigView() {
    const thead = document.getElementById('configTableHead');
    const tbody = document.getElementById('configTableBody');
    app.interviews = app.interviews.length > 0 ? app.interviews : JSON.parse(localStorage.getItem('interviewsData') || '[]');
    app.assignments = app.assignments.length > 0 ? app.assignments : JSON.parse(localStorage.getItem('assignmentsData') || '{}');
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
    `;
    tbody.innerHTML = app.students.map(student => {
        const cells = app.interviews.map(interview => {
            // build cell content based on interview properties
            if (interview.isHead && interview.interviewer) {
                return `<td>
                            <input type="text" value="${interview.interviewer}" disabled style="background: #f1f5f9; cursor: not-allowed;">
                        </td>`;
            }

            // helper to build options list
            const options = app.panelMembers.map(member => {
                const selected = (app.assignments[student] && app.assignments[student][interview.id] === member) ? 'selected' : '';
                return `<option value="${member}" ${selected}>${member}</option>`;
            }).join('');

            var facName = (app.assignments && app.assignments[student] && app.assignments[student][interview.id]) ? app.assignments[student][interview.id] : '';
            var verdicts = JSON.parse(localStorage.getItem('verdicts') || '{}');
            var thisVerdict = (verdicts[student] && verdicts[student][interview.id]) ? verdicts[student][interview.id] : '';    
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

        return `<tr>
                    <td>${student}</td>
                    ${cells}
                    <td>
                        <input type="text" placeholder="Add remarks" value="${remarks}" onchange="(function(s){ app.assignments[s] = app.assignments[s] || {}; app.assignments[s]['remarks'] = this.value; }).call(this, ${JSON.stringify(student)})">
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
