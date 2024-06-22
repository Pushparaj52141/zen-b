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
    const filterIcon = document.getElementById('toggle_filter');
    const filterOptions = document.getElementById('filter_options');
    const applyFiltersButton = document.getElementById('apply_filters');
    const searchInput = document.querySelector('#search_form input[name="example-input1-group2"]');
    const addTrainerForm = document.getElementById('addTrainerForm');
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
            $('#leadFormModal').modal('hide'); // Use jQuery to hide the modal
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

    function displayLeads(leads) {
        const sections = {
            'enquiry': document.getElementById('enquiry').querySelector('.leads'),
            'enrollment': document.getElementById('enrollment').querySelector('.leads'),
            'training progress': document.getElementById('training-progress').querySelector('.leads'),
            'hands on project': document.getElementById('hands-on-project').querySelector('.leads'),
            'certificate completion': document.getElementById('certificate-completion').querySelector('.leads'),
            'cv build': document.getElementById('cv-build').querySelector('.leads'),
            'mock interviews': document.getElementById('mock-interviews').querySelector('.leads'),
            'placement': document.getElementById('placement').querySelector('.leads')
        };
    
        Object.values(sections).forEach(section => section.innerHTML = '');
    
        const counts = {
            'enquiry': 0,
            'enrollment': 0,
            'training progress': 0,
            'hands on project': 0,
            'certificate completion': 0,
            'cv build': 0,
            'mock interviews': 0,
            'placement': 0
        };
    
        leads.forEach(lead => {
            const leadCard = document.createElement('div');
            leadCard.className = 'lead-card';
            leadCard.draggable = true;
            const timeDiff = getTimeDifference(lead.created_at);
    
            // Determine the background color for the paid status circle
            let paidStatusColor = '';
            let paidStatusText = '';
            if (lead.paid_status.toLowerCase() === 'not paid') {
                paidStatusColor = 'red';
            } else if (lead.paid_status.toLowerCase() === 'partially paid') {
                paidStatusColor = 'yellow';
            } else if (lead.paid_status.toLowerCase() === 'paid') {
                paidStatusColor = 'green';
            }
            
    
            // Determine the class for the time span
            let timeSpanClass = timeDiff.isOverADay && lead.status.toLowerCase() === 'enquiry' ? 'bg-red' : 'bg-green';
    
            console.log('Lead:', lead);
            console.log('Paid Status Color:', paidStatusColor);
            console.log('Paid Status Text:', paidStatusText);
    
            leadCard.innerHTML = `
                <h4>${lead.name}</h4>
                <p>Mobile: ${lead.mobile_number}</p>
                <p>Course: ${lead.course}</p>
                <p>Batch: ${lead.batch_name}</p>
                <span class="time ${timeSpanClass}">${timeDiff.text}</span>
                <span class="paid-status-circle" style="background-color: ${paidStatusColor}; width: 20px; height: 20px; border-radius: 50%; display: inline-block; position: absolute; bottom: 10px; right: 10px; line-height: 20px;">${paidStatusText}</span>
            `;
    
            // Add event listeners for click and drag events
            leadCard.addEventListener('click', () => openModal(lead));
            leadCard.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(lead));
                e.dataTransfer.effectAllowed = 'move';
            });
    
            const normalizedStatus = lead.status.toLowerCase();
            if (sections[normalizedStatus]) {
                sections[normalizedStatus].appendChild(leadCard);
                counts[normalizedStatus]++;
            }
        });
    
        console.log('Counts:', counts);
        updateCounts(counts);
    }
    
    function updateCounts(counts) {
        Object.keys(counts).forEach(status => {
            const section = document.getElementById(status.replace(' ', '-'));
            const countElement = section.querySelector('.card-count');
            if (countElement) {
                countElement.textContent = ` (${counts[status]})`;
            }
        });
    }

    function openModal(lead) {
        currentLead = lead;
        document.getElementById('modalDetails').innerHTML = `
            <p><strong><i class="material-icons">person</i> Name:</strong> ${lead.name}</p>
            <p><strong><i class="material-icons">phone</i> Mobile Number:</strong> ${lead.mobile_number}</p>
            <p><strong><i class="material-icons">email</i> Email:</strong> ${lead.email}</p>
            <p><strong><i class="material-icons">work</i> Role:</strong> ${lead.role}</p>
            <p><strong><i class="material-icons">business</i> College/Company:</strong> ${lead.college_company}</p>
            <p><strong><i class="material-icons">location_on</i> Location:</strong> ${lead.location}</p>
            <p><strong><i class="material-icons">source</i> Source:</strong> ${lead.source}</p>
            <p><strong><i class="material-icons">class</i> Course Type:</strong> ${lead.course_type}</p>
            <p><strong><i class="material-icons">book</i> Course:</strong> ${lead.course}</p>
            <p><strong><i class="material-icons">group</i> Batch Name:</strong> ${lead.batch_name}</p>
            <p><strong><i class="material-icons">person_outline</i> Trainer Name:</strong> ${lead.trainer_name}</p>
            <p><strong><i class="material-icons">phone</i> Trainer Mobile:</strong> ${lead.trainer_mobile}</p>
            <p><strong><i class="material-icons">email</i> Trainer Email:</strong> ${lead.trainer_email}</p>
            <p><strong><i class="material-icons">attach_money</i> Actual Fee:</strong> ${lead.actual_fee}</p>
            <p><strong><i class="material-icons">money_off</i> Discounted Fee:</strong> ${lead.discounted_fee}</p>
            <p><strong><i class="material-icons">paid</i> Fee Paid:</strong> ${lead.fee_paid}</p>
            <p><strong><i class="material-icons">account_balance_wallet</i> Fee Balance:</strong> ${lead.fee_balance}</p>
            <p><strong><i class="material-icons">comment</i> Comments:</strong> ${lead.comments}</p>
            <p><strong><i class="material-icons">info</i> Status:</strong> ${lead.status}</p>
            <p><strong><i class="material-icons">credit_card</i> Paid Status:</strong> ${lead.paid_status}</p>
        `;
        document.getElementById('editLeadForm').style.display = 'none';
        document.getElementById('modalDetails').style.display = 'block';
        $('#leadModal').modal('show');
    }
    
    function closeModal() {
        $('#leadModal').modal('hide');
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
            const updatedLead = await response.json();
    
            if (updatedLead.status !== currentLead.status) {
                fetchLeads();
            } else {
                closeModal();
            }
            alert('Lead updated successfully!');
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
            if (response.status === 404) {
                alert('Lead not found.');
            } else {
                alert('Lead deleted successfully!');
                fetchLeads();
                closeModal();
            }
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

    function populateEditForm(lead) {
        Object.entries(lead).forEach(([key, value]) => {
            const input = editLeadForm.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });
    }

    const statusSections = document.querySelectorAll('.status-section');

    statusSections.forEach(section => {
        section.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        section.addEventListener('drop', async (e) => {
            e.preventDefault();
            const leadData = JSON.parse(e.dataTransfer.getData('text/plain'));
            const newStatus = section.querySelector('h2').innerText.toLowerCase();

            if (leadData.status.toLowerCase() !== newStatus) {
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

    filterIcon.addEventListener('click', () => {
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    });

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

    // Add Trainer Form Submission
    addTrainerForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:5000/addTrainer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('adminMessage').textContent = 'Trainer added successfully!';
                $('#addTrainerModal').modal('hide'); // Use jQuery to hide the modal
                addTrainerForm.reset(); // Reset the form fields
            } else {
                document.getElementById('adminMessage').textContent = result.message;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('adminMessage').textContent = 'An error occurred. Please try again.';
        }
    });
});
