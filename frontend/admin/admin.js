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

    // Add Lead Button
    const addLeadButton = document.createElement('button');
    addLeadButton.id = 'addLeadButton';
    addLeadButton.textContent = '+ Add Lead';
    addLeadButton.classList.add('btn', 'btn-danger');
    document.body.appendChild(addLeadButton);

    addLeadButton.addEventListener('click', () => {
        leadFormContainer.style.display = 'block';
    });

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
            if (!response.ok) {
                throw new Error(response.statusText);
            }
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
            if (!response.ok) {
                throw new Error('Unauthorized');
            }
            const leads = await response.json();
            displayLeads(leads);
        } catch (error) {
            console.error('Error:', error);
            if (error.message === 'Unauthorized') {
                alert('Unauthorized access. Please login again.');
                window.location.href = '/login';
            }
        }
    }

    function displayLeads(leads) {
        const sections = {
            'Enquiry': document.getElementById('enquiry').querySelector('.leads'),
            'Enrollment': document.getElementById('enrollment').querySelector('.leads'),
            'Training Progress': document.getElementById('training-progress').querySelector('.leads'),
            'Hands on Project': document.getElementById('hands-on-project').querySelector('.leads'),
            'Certificate Completion': document.getElementById('certificate-completion').querySelector('.leads'),
            'CV Build': document.getElementById('cv-build').querySelector('.leads'),
            'Mock Interviews': document.getElementById('mock-interviews').querySelector('.leads'),
            'Placement': document.getElementById('placement').querySelector('.leads')
        };

        Object.values(sections).forEach(section => section.innerHTML = '');

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
            return { text: `${days} day`, isOverADay: true };
        } else if (hours >= 1) {
            return { text: `${hours} hr`, isOverADay: false };
        } else if (minutes >= 1) {
            return { text: `${minutes} min`, isOverADay: false };
        } else {
            return { text: 'Now', isOverADay: false };
        }
    }

    function openModal(lead) {
        currentLead = lead;
        modalDetails.innerHTML = `
            <p><strong>Name:</strong> ${lead.name}</p>
            <p><strong>Mobile Number:</strong> ${lead.mobile_number}</p>
            <p><strong>Email:</strong> ${lead.email}</p>
            <p><strong>Role:</strong> ${lead.role}</p>
            <p><strong>College/Company:</strong> ${lead.college_company}</p>
            <p><strong>Location:</strong> ${lead.location}</p>
            <p><strong>Source:</strong> ${lead.source}</p>
            <p><strong>Course Type:</strong> ${lead.course_type}</p>
            <p><strong>Course:</strong> ${lead.course}</p>
            <p><strong>Batch Name:</strong> ${lead.batch_name}</p>
            <p><strong>Trainer Name:</strong> ${lead.trainer_name}</p>
            <p><strong>Trainer Mobile:</strong> ${lead.trainer_mobile}</p>
            <p><strong>Trainer Email:</strong> ${lead.trainer_email}</p>
            <p><strong>Actual Fee:</strong> ${lead.actual_fee}</p>
            <p><strong>Discounted Fee:</strong> ${lead.discounted_fee}</p>
            <p><strong>Fee Paid:</strong> ${lead.fee_paid}</p>
            <p><strong>Fee Balance:</strong> ${lead.fee_balance}</p>
            <p><strong>Comments:</strong> ${lead.comments}</p>
            <p><strong>Status:</strong> ${lead.status}</p>
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
            if (!response.ok) {
                throw new Error(response.statusText);
            }
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
            const newStatus = section.querySelector('h2').innerText;

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
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    const result = await response.json();
                    fetchLeads();
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to update lead status.');
                }
            }
        });
    });

    fetchLeads();
});
