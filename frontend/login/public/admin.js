document.getElementById('addTrainerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const trainerUsername = document.getElementById('trainerUsername').value;
    const trainerPassword = document.getElementById('trainerPassword').value;

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:3000/addTrainer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token // Include the JWT token
            },
            body: JSON.stringify({ trainerUsername, trainerPassword })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();

        if (result.success) {
            document.getElementById('adminMessage').textContent = 'Trainer added successfully!';
        } else {
            document.getElementById('adminMessage').textContent = result.message;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('adminMessage').textContent = 'An error occurred. Please try again.';
    }
});
