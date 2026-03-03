let allArtists = [];

// Load artist names for the search/autocomplete feature
async function loadArtistsData() {
    try {
        const response = await fetch('artists_with_clusters.csv');
        const csvData = await response.text();

        Papa.parse(csvData, {
            header: true,
            complete: function(results) {
                // Map to the column that contains the names
                allArtists = results.data.map(row => row.artist_lastfm).filter(name => name);
                console.log("Autocomplete data is ready");
            }
        });
    } catch (error) {
        console.error("Could not find the CSV file:", error);
    }
}

// Setup search box suggestions
const inputContainers = document.querySelectorAll('.Input-Box');

inputContainers.forEach(container => {
    const input = container.querySelector('.artist-input');
    const list = container.querySelector('.suggestions-list');

    input.addEventListener('input', (e) => {
        const typedText = e.target.value.toLowerCase();
        list.innerHTML = ''; 

        if (typedText.length >= 2) {
            const matches = allArtists.filter(name => 
                name && name.toLowerCase().includes(typedText)
            ).slice(0, 10);

            displaySuggestions(matches, list, input);
        }
    });
});

function displaySuggestions(matches, listElement, inputElement) {
    listElement.innerHTML = '';
    matches.forEach(artistName => {
        const li = document.createElement('li');
        li.textContent = artistName;
        li.addEventListener('click', () => {
            inputElement.value = artistName;
            listElement.innerHTML = '';
        });
        listElement.appendChild(li);
    });
}

loadArtistsData();

// Recommendation Button Logic
const recommendBtn = document.querySelector('.Recommendation-Button a');
const artistInputs = document.querySelectorAll('.artist-input');

recommendBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const selectedArtists = Array.from(artistInputs)
        .map(input => input.value.trim())
        .filter(name => name !== "");

    if (selectedArtists.length === 0) {
        alert("Please enter at least one artist!");
        return;
    }

    try {
        // Fetch to the specific /recommend endpoint
        const response = await fetch('https://artist-suggestion.onrender.com/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artists: selectedArtists }),
        });

        const recommendations = await response.json();

        if (response.ok) {
            displayResults(recommendations);
        } else {
            console.error("Server error:", recommendations.error);
        }
    } catch (error) {
        console.error("Connection failed:", error);
    }
});

function displayResults(data) {
    const container = document.getElementById('recommendations-container');
    container.innerHTML = ''; 

    data.forEach(artist => {
        const card = document.createElement('div');
        card.className = 'Artist-Card';

        card.innerHTML = `
            <h2>${artist.name}</h2>
            <p>Style Match: High</p>
            <p>SVD: ${artist.svd_coordinates[0].toFixed(2)}, ${artist.svd_coordinates[1].toFixed(2)}</p>
            <span class="Cluster-Tag">${artist.display_name}</span>
        `;
        container.appendChild(card);
    });

    container.scrollIntoView({ behavior: 'smooth' });
}
