document.addEventListener('DOMContentLoaded', () => {
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const nextBtn = document.querySelectorAll('.btn-next');
    const prevBtn = document.querySelectorAll('.btn-prev');
    const form = document.getElementById('leadForm');
    const leadFormContainer = document.getElementById('leadFormContainer');
    const leadModal = document.getElementById('leadModal');
    const modalDetails = document.getElementById('modalDetails');
    const editLeadForm = document.getElementById('editLeadForm');
    const editLeadButton = document.getElementById('editLeadButton');
    const deleteLeadButton = document.getElementById('deleteLeadButton');
    const closeModalBtn = document.querySelector('.close');
    let currentStep = 0;
    let currentLead = null;

    let leads = [];

    nextBtn.forEach(button => {
        button.addEventListener('click', () => {
            steps[currentStep].classList.remove('form-step-active');
            currentStep = currentStep + 1;
            steps[currentStep].classList.add('form-step-active');
        });
    });

    prevBtn.forEach(button => {
        button.addEventListener('click', () => {
            steps[currentStep].classList.remove('form-step-active');
            currentStep = currentStep - 1;
            steps[currentStep].classList.add('form-step-active');
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
    
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const token = localStorage.getItem('token');
    
        try {
            const response = await fetch('http://localhost:5000/leads', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert('Lead added successfully!');
            form.reset();
            steps[currentStep].classList.remove('form-step-active');
            currentStep = 0;
            steps[currentStep].classList.add('form-step-active');
            leadFormContainer.style.display = 'none';
            fetchLeads();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to add lead.');
        }
    });

    async function fetchLeads() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:5000/leads', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            leads = await response.json();
            console.log("Fetched data:", leads);
            displayLeads(leads);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayLeads(leads) {
        const sections = {
            'Enquiry': document.getElementById('enquiry').querySelector('.leads'),
            'Enrollment': document.getElementById('enrollment').querySelector('.leads'),
            'Training Progress': document.getElementById('training-progress').querySelector('.leads'),
            'Hands on Project': document.getElementById('hands-on-project').querySelector('.leads'),
            'Cert-Completion': document.getElementById('certificate-completion').querySelector('.leads'),
            'CV Build': document.getElementById('cv-build').querySelector('.leads'),
            'Mock Interviews': document.getElementById('mock-interviews').querySelector('.leads'),
            'Placement': document.getElementById('placement').querySelector('.leads')
        };
    
        Object.values(sections).forEach(section => section.innerHTML = '');
    
        const counts = {
            'Enquiry': 0,
            'Enrollment': 0,
            'Training Progress': 0,
            'Hands on Project': 0,
            'Cert-Completion': 0,
            'CV Build': 0,
            'Mock Interviews': 0,
            'Placement': 0
        };
    
        leads.forEach(lead => {
            const leadCard = document.createElement('div');
            leadCard.className = 'lead-card';
            leadCard.draggable = true;
            const timeDiff = getTimeDifference(lead.created_at);
            leadCard.innerHTML = `
                <h4>${lead.name}</h4>
                <p>Mobile: ${lead.mobile_number}</p>
                <p>Course: ${lead.course}</p>
                <p>Batch: ${lead.batch_name}</p>
                <span class="time ${timeDiff.isOverADay && lead.status === 'Enquiry' ? 'bg-red' : 'bg-green'}">${timeDiff.text}</span>
            `;
            leadCard.addEventListener('click', () => openModal(lead));
            leadCard.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(lead));
                e.dataTransfer.effectAllowed = 'move';
            });
    
            if (sections[lead.status]) {
                sections[lead.status].appendChild(leadCard);
                counts[lead.status]++;
            }
        });

        updateCounts(counts);
    }

    function updateCounts(counts) {
        Object.keys(counts).forEach(status => {
            const section = document.getElementById(status.toLowerCase().replace(' ', '-'));
            const countElement = section.querySelector('.card-count');
            if (countElement) {
                countElement.textContent = ` (${counts[status]})`;
            }
        });
    }

    function getTimeDifference(timestamp) {
        const now = new Date();
        const leadDate = new Date(timestamp);
        const differenceInMs = now - leadDate;

        const days = Math.floor(differenceInMs / 86400000);
        const hours = Math.floor((differenceInMs % 86400000) / 3600000);
        const minutes = Math.floor((differenceInMs % 3600000) / 60000);

        if (days >= 1) {
            return { text: `${days}d`, isOverADay: true };
        } else if (hours >= 1) {
            return { text: `${hours}hr`, isOverADay: false };
        } else if (minutes >= 1) {
            return { text: `${minutes}min`, isOverADay: false };
        } else {
            return { text: 'Now', isOverADay: false };
        }
    }

    function openModal(lead) {
        currentLead = lead;
        modalDetails.innerHTML = `
    <div class="container">
        <div class="row">
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-person-fill"></i> <strong>Name:</strong> ${lead.name}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-telephone-fill"></i> <strong>Mobile Number:</strong> ${lead.mobile_number}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-envelope-fill"></i> <strong>Email:</strong> ${lead.email}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-briefcase-fill"></i> <strong>Role:</strong> ${lead.role}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-building"></i> <strong>College/Company:</strong> ${lead.college_company}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-geo-alt-fill"></i> <strong>Location:</strong> ${lead.location}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-search"></i> <strong>Source:</strong> ${lead.source}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-journal-text"></i> <strong>Course Type:</strong> ${lead.course_type}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-book"></i> <strong>Course:</strong> ${lead.course}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-calendar3"></i> <strong>Batch Name:</strong> ${lead.batch_name}</p>
            </div>
            <div class="col-md-12 mb-2">
                <a href="https://wa.me/91${lead.mobile_number}" target="_blank" class="btn btn-success">Chat on WhatsApp</a>
            </div>
        </div>
    </div>
        `;
        editLeadForm.style.display = 'none';
        modalDetails.style.display = 'block';
        leadModal.style.display = 'block';
    }

    function closeModal() {
        leadModal.style.display = 'none';
    }

    async function editLead() {
        const formData = new FormData(editLeadForm);
        const data = Object.fromEntries(formData.entries());
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`http://localhost:5000/leads/${currentLead.lead_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert('Lead updated successfully!');
            fetchLeads();
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update lead.');
        }
    }

    async function deleteLead(leadId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/leads/${leadId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            alert('Lead deleted successfully!');
            fetchLeads();
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to delete lead.');
        }
    }

    editLeadButton.onclick = () => {
        populateEditForm(currentLead);
        editLeadForm.style.display = 'block';
        modalDetails.style.display = 'none';
    };

    editLeadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        editLead();
    });

    deleteLeadButton.onclick = () => deleteLead(currentLead.lead_id);
    closeModalBtn.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == leadModal) {
            closeModal();
        }
    };

    function populateEditForm(lead) {
        Object.entries(lead).forEach(([key, value]) => {
            const input = editLeadForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }

    // Drag and Drop Events
    const statusSections = document.querySelectorAll('.status-section');

    statusSections.forEach(section => {
        section.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        section.addEventListener('drop', async (e) => {
            e.preventDefault();
            const leadData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const newStatus = section.querySelector('h2').innerText.split(' (')[0];

            if (leadData.status !== newStatus) {
                leadData.status = newStatus;
                const token = localStorage.getItem('token');
        
                try {
                    const response = await fetch(`http://localhost:5000/leads/${leadData.lead_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(leadData)
                    });
                    const result = await response.json();
                    fetchLeads();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to update lead status.');
                }
            }
        });
    });

    // Fetch and populate filter options
    async function fetchFilterOptions() {
        try {
            const [coursesResponse, statusesResponse] = await Promise.all([
                fetch('http://localhost:5000/courses'),
                fetch('http://localhost:5000/statuses')
            ]);

            const courses = await coursesResponse.json();
            const statuses = await statusesResponse.json();

            populateFilterOptions('filter_course', courses, 'course');
            populateFilterOptions('filter_status', statuses, 'status');
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    }

    function populateFilterOptions(elementId, options, key) {
        const selectElement = document.getElementById(elementId);
        selectElement.innerHTML = '<option value="">All</option>';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option[key];
            opt.textContent = option[key];
            selectElement.appendChild(opt);
        });
    }

    // Toggle filter options visibility
    const filterIcon = document.getElementById('toggle_filter');
    const filterOptions = document.getElementById('filter_options');
    filterIcon.addEventListener('click', () => {
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    });

    // Apply filters
    const applyFiltersButton = document.getElementById('apply_filters');
    applyFiltersButton.addEventListener('click', applyFilters);

    function applyFilters() {
        const courseFilter = document.getElementById('filter_course').value;
        const statusFilter = document.getElementById('filter_status').value;

        const filteredLeads = leads.filter(lead => {
            return (courseFilter === '' || lead.course === courseFilter) && 
                   (statusFilter === '' || lead.status === statusFilter);
        });

        displayLeads(filteredLeads);
    }

    // Real-time filtering
    const searchInput = document.querySelector('#search_form input[name="example-input1-group2"]');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredLeads = leads.filter(lead => lead.name.toLowerCase().includes(searchTerm));
        displayLeads(filteredLeads);
    });

    document.querySelector('#search_form').addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.toLowerCase();
        const filteredLeads = leads.filter(lead => lead.name.toLowerCase().includes(searchTerm));
        displayLeads(filteredLeads);
    });

    fetchFilterOptions();
    fetchLeads();
});

document.getElementById('addTrainerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/addTrainer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();z

        if (result.success) {
            document.getElementById('adminMessage').textContent = 'Trainer added successfully!';
            document.getElementById('adminMessage').style.color = 'green';
            $('#addTrainerModal').modal('hide');
        } else {
            document.getElementById('adminMessage').textContent = result.message;
            document.getElementById('adminMessage').style.color = 'red';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('adminMessage').textContent = 'An error occurred. Please try again.';
        document.getElementById('adminMessage').style.color = 'red';
    }
});
