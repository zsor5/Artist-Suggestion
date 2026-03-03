let allArtists = [];

async function loadArtistsData()
{
    try
    {
        const response = await fetch('artists_with_clusters.csv');
        const csvData = await response.text();

        Papa.parse(csvData, {
            header: true,
            complete: function(results){
                allArtists = results.data.map(row => row.artist_lastfm);
                console.log("Data is ready");
            }
        });
    } catch(error) {
        console.error("Could not find the CSV file");
    }
}
const inputContainers = document.querySelectorAll('.Input-Box');

inputContainers.forEach(container => {
    const input = container.querySelector('.artist-input');
    const list = container.querySelector('.suggestions-list');

    input.addEventListener('input', (e) => {
        const typedText = e.target.value.toLowerCase();
        list.innerHTML = ''; // Clear old suggestions

        if (typedText.length >= 2) {
            const matches = allArtists.filter(name => 
                name && name.toLowerCase().includes(typedText)
            ).slice(0, 10);

            // FIX 4: Call drawing function with the specific list for THIS box
            displaySuggestions(matches, list, input);
        }
    });
});

// Mission 2.5: Updated to handle multiple lists
function displaySuggestions(matches, listElement, inputElement) {
    listElement.innerHTML = '';

    matches.forEach(artistName => {
        const li = document.createElement('li');
        li.textContent = artistName;
        
        li.addEventListener('click', () => {
            inputElement.value = artistName; // Fill the specific input
            listElement.innerHTML = '';     // Clear the specific list
        });

        listElement.appendChild(li);
    });
}

loadArtistsData();


// Locate the button and inputs
const recommendBtn = document.querySelector('.Recommendation-Button a');
const artistInputs = document.querySelectorAll('.artist-input');

recommendBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // Stop the link from refreshing the page

    // 1. Collect values from the 3 input boxes
    const selectedArtists = Array.from(artistInputs)
        .map(input => input.value.trim())
        .filter(name => name !== ""); // Remove empty boxes

    if (selectedArtists.length === 0) {
        alert("Please enter at least one artist!");
        return;
    }

    try {
        // 2. Send the data to your Python Flask Server
        const response = await fetch('https://artist-suggestion.onrender.com',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ artists: selectedArtists }),
        });

        const recommendations = await response.json();

        // 3. Handle the results
        if (response.ok) {
            console.log("Recommendations received:", recommendations);
            displayResults(recommendations);
        } else {
            console.error("Server error:", recommendations.error);
        }
    } catch (error) {
        console.error("Connection failed. Is the Flask server running?", error);
    }
});

// Simple function to show results on the page
function displayResults(data) {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = ''; // Clear previous results

    data.forEach(artist => {
        // Create the card element
        const card = document.createElement('div');
        card.className = 'Artist-Card';

        // Build the inner HTML
        // We use .toFixed(2) to make the SVD coordinates look clean
        card.innerHTML = `
            <h2>${artist.name}</h2>
            <p>Style Match: High</p>
            <p>SVD: ${artist.svd_coordinates[0].toFixed(2)}, ${artist.svd_coordinates[1].toFixed(2)}</p>
            <span class="Cluster-Tag">Cluster ${artist.cluster_id}</span>
        `;

        container.appendChild(card);
    });

    // Smoothly scroll down to the results
    container.scrollIntoView({ behavior: 'smooth' });
}