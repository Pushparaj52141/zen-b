document.addEventListener('DOMContentLoaded', () => {
    const steps = Array.from(document.querySelectorAll('.form-step'));
    const nextBtn = document.querySelectorAll('.btn-next');
    const prevBtn = document.querySelectorAll('.btn-prev');
    const editLeadForm = document.getElementById('editLeadForm');
    const leadModal = document.getElementById('leadModal');
    const modalDetails = document.getElementById('modalDetails');
    const editLeadButton = document.getElementById('editLeadButton');
    const deleteLeadButton = document.getElementById('deleteLeadButton');
    const closeModalBtn = document.querySelector('.close');
    let currentStep = 0;
    let currentLead = null;

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

    async function fetchLeads() {
        try {
            const response = await fetch('http://localhost:5000/trainer/leads');
            const leads = await response.json();
            displayLeads(leads);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayLeads(leads) {
        const sections = {
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
            leadCard.innerHTML = `
                <h4>${lead.name}</h4>
                <p>Mobile: ${lead.mobile_number}</p>
                <p>Course: ${lead.course}</p>
                <p>Batch: ${lead.batch_name}</p>
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
                <p><i class="bi bi-person-video2"></i> <strong>Trainer Name:</strong> ${lead.trainer_name}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-phone"></i> <strong>Trainer Mobile:</strong> ${lead.trainer_mobile}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-envelope"></i> <strong>Trainer Email:</strong> ${lead.trainer_email}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-chat-left-text-fill"></i> <strong>Comments:</strong> ${lead.comments}</p>
            </div>
            <div class="col-md-12 mb-2">
                <p><i class="bi bi-info-circle-fill"></i> <strong>Status:</strong> ${lead.status}</p>
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

        try {
            const response = await fetch(`http://localhost:5000/trainer/leads/${currentLead.lead_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert('Lead updated successfully!');
            fetchLeads(); // Refresh the lead cards to show the updated lead
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to update lead.');
        }
    }

    async function deleteLead(leadId) {
        try {
            const response = await fetch(`http://localhost:5000/trainer/leads/${leadId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            alert('Lead deleted successfully!');
            fetchLeads(); // Refresh the lead cards after deletion
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
        
                try {
                    const response = await fetch(`http://localhost:5000/trainer/leads/${leadData.lead_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(leadData)
                    });
                    const result = await response.json();
                    fetchLeads(); // Refresh the lead cards to show the updated status
                } catch (error) {
                    console.error('Error:', error);
                    alert('Failed to update lead status.');
                }
            }
        });
    });

    fetchLeads();
});
