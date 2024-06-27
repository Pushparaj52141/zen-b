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
    const archiveLeadButton = document.getElementById('archiveLeadButton');
    const filterIcon = document.getElementById('toggle_filter');
    const filterOptions = document.getElementById('filter_options');
    const applyFiltersButton = document.getElementById('apply_filters');
    const searchInput = document.querySelector('#search_form input[name="example-input1-group2"]');
    const addTrainerForm = document.getElementById('addTrainerForm');
    let currentStep = 0;
    let currentLead = null;
    let leads = [];

    const statusSections = document.querySelectorAll('.status-section');

    // Function to initialize card counts
    const initializeCardCounts = () => {
        statusSections.forEach(section => {
            const heading = section.querySelector('h2');
            if (heading) {
                const countSpan = document.createElement('span');
                countSpan.classList.add('card-count');
                countSpan.textContent = ' (0)';
                heading.appendChild(countSpan);
                updateCardCount(section);
            }
        });
    };

    // Function to update the count of cards in a section
    const updateCardCount = (section) => {
        const cards = section.querySelectorAll('.lead-card');
        const countSpan = section.querySelector('.card-count');
        if (countSpan) {
            countSpan.textContent = ` (${cards.length})`;
        }
    };

    initializeCardCounts();

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
            console.log('Lead added successfully:', result);
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
        console.log('Fetching leads...');
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:5000/leads', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            leads = await response.json();
            console.log('Leads fetched successfully:', leads);
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
        console.log('Displaying leads...');
        const sections = {
            'enquiry': document.getElementById('enquiry').querySelector('.leads'),
            'enrollment': document.getElementById('enrollment').querySelector('.leads'),
            'training progress': document.getElementById('training-progress').querySelector('.leads'),
            'hands on project': document.getElementById('hands-on-project').querySelector('.leads'),
            'certification': document.getElementById('certification').querySelector('.leads'),
            'cv build': document.getElementById('cv-build').querySelector('.leads'),
            'mock interviews': document.getElementById('mock-interviews').querySelector('.leads'),
            'placement': document.getElementById('placement').querySelector('.leads')
        };

        Object.values(sections).forEach(section => section.innerHTML = '');

        // Populate course options dynamically
        const courseSet = new Set();
        leads.forEach(lead => courseSet.add(lead.course));
        const courseSelect = document.getElementById('filter_course');
        courseSelect.innerHTML = '<option value="">All</option>'; // Clear existing options
        courseSet.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseSelect.appendChild(option);
        });

        leads.forEach(lead => {
            const leadCard = document.createElement('div');
            leadCard.className = 'lead-card';
            leadCard.draggable = true;
            const timeDiff = getTimeDifference(lead.created_at);

            let paidStatusColor = '';
            let paidStatusText = '';
            if (lead.paid_status.toLowerCase() === 'not paid') {
                paidStatusColor = 'red';
            } else if (lead.paid_status.toLowerCase() === 'partially paid') {
                paidStatusColor = 'yellow';
            } else if (lead.paid_status.toLowerCase() === 'paid') {
                paidStatusColor = 'green';
            }

            let timeSpanClass = timeDiff.isOverADay && lead.status.toLowerCase() === 'enquiry' ? 'bg-red' : 'bg-green';

            leadCard.innerHTML = `
                <h4>${lead.name}</h4>
                <p>Mobile: ${lead.mobile_number}</p>
                <p>Course: ${lead.course}</p>
                <p>Batch: ${lead.batch_name}</p>
                <span class="time ${timeSpanClass}">${timeDiff.text}</span>
                <span class="paid-status-circle" style="background-color: ${paidStatusColor}; width: 20px; height: 20px; border-radius: 50%; display: inline-block; position: absolute; bottom: 10px; right: 10px; line-height: 20px;">${paidStatusText}</span>
            `;

            leadCard.addEventListener('click', () => openModal(lead));
            leadCard.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(lead));
                e.dataTransfer.effectAllowed = 'move';
                console.log("Drag start:", lead);
            });

            const normalizedStatus = lead.status.toLowerCase();
            if (sections[normalizedStatus]) {
                sections[normalizedStatus].appendChild(leadCard);
                updateCardCount(sections[normalizedStatus].parentElement); // Update the count for the section
            }
        });

        // Update counts for all sections after adding leads
        statusSections.forEach(section => updateCardCount(section));
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
            ${lead.enrollment_id ? `<p><strong><i class="material-icons">assignment_ind</i> Enrollment ID:</strong> ${lead.enrollment_id}</p>` : ''}
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

    async function archiveLead(leadId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/leads/archive/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                alert('Lead archived successfully!');
                fetchLeads(); // Refresh active leads list
                closeModal();
            } else {
                alert('Failed to archive lead.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to archive lead.');
        }
    }

    archiveLeadButton.onclick = () => archiveLead(currentLead.lead_id);

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

    statusSections.forEach(section => {
        section.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        section.addEventListener('drop', async (e) => {
            e.preventDefault();
            const leadData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log("Drop event:", leadData);
            const newStatusElement = e.target.closest('.status-section');
            if (!newStatusElement) return;
            const newStatus = newStatusElement.id.replace(/-/g, ' ');

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
                        body: JSON.stringify(leadData) // Send the entire lead object
                    });
                    const result = await response.json();
                    console.log("Lead status updated successfully:", result);
                    if (result.error) {
                        console.error('Failed to update lead:', result.error);
                        alert('Failed to update lead status.');
                    } else {
                        await fetchLeads(); // Re-fetch leads to update the UI
                    }
                } catch (error) {
                    console.error('Error updating lead status:', error);
                    alert('Failed to update lead status.');
                }
            }
        });
    });

    function applyFilters() {
        const courseFilter = document.getElementById('filter_course').value;
        const statusFilter = document.getElementById('filter_status').value;
        const timePeriodFilter = document.getElementById('filter_time_period').value;

        const filteredLeads = leads.filter(lead => {
            const matchesCourse = courseFilter === '' || lead.course === courseFilter;
            const matchesStatus = statusFilter === '' || lead.status === statusFilter;
            const matchesTimePeriod = timePeriodFilter === '' || withinTimePeriod(lead.created_at, timePeriodFilter);

            return matchesCourse && matchesStatus && matchesTimePeriod;
        });

        displayLeads(filteredLeads);
    }

    function withinTimePeriod(leadTime, timePeriod) {
        const now = new Date();
        const leadDate = new Date(leadTime);
        const differenceInMs = now - leadDate;

        if (timePeriod === 'last24hours') {
            return differenceInMs <= 86400000;
        } else if (timePeriod === 'last7days') {
            return differenceInMs <= 604800000;
        } else if (timePeriod === 'last30days') {
            return differenceInMs <= 2592000000;
        }
        return true;
    }

    filterIcon.addEventListener('click', () => {
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    });

    applyFiltersButton.addEventListener('click', applyFilters);

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

    // Fetch archived leads button event listener
    document.getElementById('fetchArchivedLeadsBtn').addEventListener('click', fetchArchivedLeads);

    async function fetchArchivedLeads() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch('http://localhost:5000/leads/archived', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const archivedLeads = await response.json();
            displayArchivedLeads(archivedLeads);
        } catch (error) {
            console.error('Error fetching archived leads:', error);
        }
    }

    function displayArchivedLeads(leads) {
        const archivedSection = document.getElementById('archived-leads');
        archivedSection.innerHTML = '';

        leads.forEach(lead => {
            const leadCard = document.createElement('div');
            leadCard.className = 'lead-card';
            leadCard.innerHTML = `
                <h4>${lead.name}</h4>
                <p>Mobile: ${lead.mobile_number}</p>
                <p>Course: ${lead.course}</p>
                <p>Batch: ${lead.batch_name}</p>
                <p>Status: ${lead.status}</p>
                <button class="btn btn-primary btn-sm restore-btn" data-lead-id="${lead.lead_id}">Restore</button>
            `;

            leadCard.querySelector('.restore-btn').addEventListener('click', () => restoreLead(lead.lead_id));
            archivedSection.appendChild(leadCard);
        });
    }

    async function restoreLead(leadId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://localhost:5000/leads/restore/${leadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'Enquiry' }) // or any other status you want to restore to
            });
            if (response.ok) {
                alert('Lead restored successfully!');
                fetchArchivedLeads(); // Refresh archived leads list
                fetchLeads(); // Refresh active leads list
            } else {
                alert('Failed to restore lead.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to restore lead.');
        }
    }

    // Fetch leads on page load
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

function allowDrop(event) {
    event.preventDefault();
}

async function drop(event) {
    event.preventDefault();
    const leadData = JSON.parse(event.dataTransfer.getData('text/plain'));
    console.log("Drop event:", leadData);
    const newStatusElement = event.target.closest('.status-section');
    if (!newStatusElement) return;
    const newStatus = newStatusElement.id.replace(/-/g, ' ');

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
                body: JSON.stringify(leadData) // Send the entire lead object
            });
            const result = await response.json();
            console.log("Lead status updated successfully:", result);
            if (result.error) {
                console.error('Failed to update lead:', result.error);
                alert('Failed to update lead status.');
            } else {
                await fetchLeads(); // Re-fetch leads to update the UI
            }
        } catch (error) {
            console.error('Error updating lead status:', error);
           
        }
    }
}
